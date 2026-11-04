/**
 * Press Pay Btn — the client-safe face of the game.
 *
 * The rules live in `press-pay-rules` (no node imports, so the page reads them
 * directly). Every press goes through a server function into `upayu-core`, so a
 * press lands on the one real account and writes a RUHBI ledger line — this
 * file never keeps a private copy of the balance.
 */
import { createServerFn } from "@tanstack/react-start";

export {
  PI_BUTTON_PRESSES,
  PRESS_TIERS,
  PRESS_UPGRADE_COST,
  PRESS_UPGRADE_UNLOCK_POINTS,
  pressNet,
  type PressPayState,
  type PressTier,
  type PressTierView,
  type PressView,
} from "./press-pay-rules";

export type { Snapshot, SnapshotWith } from "./upayu-core";

export const getPressPay = createServerFn({ method: "GET" }).handler(async () => {
  const core = await import("./upayu-core");
  return core.readSnapshot();
});

type PressInput = { tier?: string };

export const press = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as PressInput)
  .handler(async ({ data }) => {
    const core = await import("./upayu-core");
    return core.pressPoints({ tier: data?.tier });
  });

export const upgradePress = createServerFn({ method: "POST" }).handler(async () => {
  const core = await import("./upayu-core");
  return core.pressUpgrade();
});
