// Don't change these values. They're used by React Dev Tools.
export const NoFlags = /*                      */ 0b00000000000000000000000000;
export const PerformedWork = /*                */ 0b00000000000000000000000001;
export const Placement = /*                    */ 0b00000000000000000000000010;
export const DidCapture = /*                   */ 0b00000000000000000001000000;
export const Hydrating = /*                    */ 0b00000000000000100000000000;

// You can change the rest (and add more).
export const Update = /*                       */ 0b00000000000000000000000100;
export const ChildDeletion = /*                */ 0b00000000000000000000001000;
export const ContentReset = /*                 */ 0b00000000000000000000010000;
export const Callback = /*                     */ 0b00000000000000000000100000;
export const ForceClientRender = /*            */ 0b00000000000000000010000000;
export const Ref = /*                          */ 0b00000000000000000100000000;
export const Snapshot = /*                     */ 0b00000000000000001000000000;
export const Passive = /*                      */ 0b00000000000000010000000000;
export const Visibility = /*                   */ 0b00000000000001000000000000;
export const StoreConsistency = /*             */ 0b00000000000010000000000000;

export const LifecycleEffectMask = Passive | Update | Callback | Ref | Snapshot | StoreConsistency;

// Union of all commit flags (flags with the lifetime of a particular commit)
export const HostEffectMask = /*               */ 0b00000000000011111111111111;

// These are not really side effects, but we still reuse this field.
export const Incomplete = /*                   */ 0b00000000000100000000000000;
export const ShouldCapture = /*                */ 0b00000000001000000000000000;
export const ForceUpdateForLegacySuspense = /* */ 0b00000000010000000000000000;
export const DidPropagateContext = /*          */ 0b00000000100000000000000000;
export const NeedsPropagation = /*             */ 0b00000001000000000000000000;
export const Forked = /*                       */ 0b00000010000000000000000000;

// Static tags describe aspects of a fiber that are not specific to a render,
// e.g. a fiber uses a passive effect (even if there are no updates on this particular render).
// This enables us to defer more work in the unmount case,
// since we can defer traversing the tree during layout to look for Passive effects,
// and instead rely on the static flag as a signal that there may be cleanup work.
export const RefStatic = /*                    */ 0b00000100000000000000000000;
export const LayoutStatic = /*                 */ 0b00001000000000000000000000;
export const PassiveStatic = /*                */ 0b00010000000000000000000000;

// Flag used to identify newly inserted fibers. It isn't reset after commit unlike `Placement`.
export const PlacementDEV = /*                 */ 0b00100000000000000000000000;
export const MountLayoutDev = /*               */ 0b01000000000000000000000000;
export const MountPassiveDev = /*              */ 0b10000000000000000000000000;