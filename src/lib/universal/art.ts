/**
 * The `art` adapter — the Art Integration App's saved pieces.
 *
 * Saving goes through `upayu-core.saveArtWork`, so a finished piece earns its
 * points into the same account as everything else rather than a second ledger.
 */
import { readSnapshot, saveArtWork, type ArtPiece } from "~/lib/upayu-core";

import {
  badRequest,
  bodyNumber,
  bodyString,
  fail,
  ok,
  type CallInput,
  type Reply,
  type ServiceAdapter,
} from "./envelope";

/** A piece without its thumbnail — a list of them stays readable in a terminal. */
type PieceSummary = Omit<ArtPiece, "thumb"> & { hasThumb: boolean };

function summarise(piece: ArtPiece): PieceSummary {
  const { thumb, ...rest } = piece;
  return { ...rest, hasThumb: Boolean(thumb) };
}

function call(action: string, input: CallInput): Promise<Reply> | Reply {
  switch (action) {
    case "list": {
      return readSnapshot().then((snapshot) =>
        ok("art", action, {
          count: snapshot.account.pieces.length,
          pieces: snapshot.account.pieces.map(summarise),
        }),
      );
    }
    case "save": {
      const name = bodyString(input.body, "name");
      const media = bodyString(input.body, "media");
      if (!name || !media) {
        return badRequest("art", action, "save needs { name, media } and takes { thumb }.");
      }
      return saveArtWork({
        name,
        media,
        thumb: bodyString(input.body, "thumb"),
        points: bodyNumber(input.body, "points"),
      }).then((snapshot) =>
        ok("art", action, {
          piece: snapshot.account.pieces[0] ? summarise(snapshot.account.pieces[0]) : null,
          awarded: snapshot.awarded,
          message: snapshot.message,
          points: snapshot.account.points,
          dollarValue: snapshot.dollarValue,
        }),
      );
    }
    default:
      return fail("art", action, "not_found", `art has no action "${action}".`, 404);
  }
}

export const artAdapter: ServiceAdapter = {
  name: "art",
  status: "live",
  actions: ["save", "list"],
  blurb: "The Art Integration App — eight media, every saved piece earns bridge points.",
  call,
};
