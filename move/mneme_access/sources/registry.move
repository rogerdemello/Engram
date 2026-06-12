/// mneme_access — on-chain consent + access-control layer for Mneme.
///
/// A user owns a `ConsentRegistry`. They grant / revoke per-(app, namespace)
/// access to their AI memories. Grants are the single source of truth for:
///   1. App-level consent — the Mneme backend checks `is_authorized` before
///      letting one app's agent recall memories from another app's namespace.
///   2. Seal decryption — `seal_approve` aborts unless the caller (the Seal
///      SessionKey's address) holds a live grant, so revoking on-chain
///      immediately blocks decryption of sensitive (Sealed) memories.
///
/// Every grant / revoke emits an event, forming a tamper-evident audit trail.
///
/// NOTE: draft — validate with `sui move build` before relying on stdlib API
/// shapes (vec_map method syntax may differ across framework versions).
module mneme_access::registry;

use std::string::String;
use sui::event;
use sui::vec_map::{Self, VecMap};

const ENotOwner: u64 = 0;
const ENotAuthorized: u64 = 1;

/// Identifies an (app address, namespace) pair that a grant applies to.
public struct GrantKey has copy, drop, store {
    app: address,
    namespace: String,
}

/// Owned by the user. Holds all access grants for their memories.
public struct ConsentRegistry has key {
    id: UID,
    owner: address,
    /// (app, namespace) -> active?  (false = revoked, kept for audit history)
    grants: VecMap<GrantKey, bool>,
}

public struct AccessGranted has copy, drop {
    registry: ID,
    owner: address,
    app: address,
    namespace: String,
}

public struct AccessRevoked has copy, drop {
    registry: ID,
    owner: address,
    app: address,
    namespace: String,
}

/// Create a registry and transfer it to the caller.
entry fun create(ctx: &mut TxContext) {
    let reg = ConsentRegistry {
        id: object::new(ctx),
        owner: ctx.sender(),
        grants: vec_map::empty(),
    };
    transfer::transfer(reg, ctx.sender());
}

/// Grant `app` access to `namespace`. Owner only.
entry fun grant_access(
    reg: &mut ConsentRegistry,
    app: address,
    namespace: String,
    ctx: &TxContext,
) {
    assert!(reg.owner == ctx.sender(), ENotOwner);
    let key = GrantKey { app, namespace };
    if (reg.grants.contains(&key)) {
        *reg.grants.get_mut(&key) = true;
    } else {
        reg.grants.insert(key, true);
    };
    event::emit(AccessGranted {
        registry: object::id(reg),
        owner: reg.owner,
        app,
        namespace,
    });
}

/// Revoke `app`'s access to `namespace`. Owner only. The grant row is kept
/// (set to false) so the audit history of "was once granted" survives.
entry fun revoke_access(
    reg: &mut ConsentRegistry,
    app: address,
    namespace: String,
    ctx: &TxContext,
) {
    assert!(reg.owner == ctx.sender(), ENotOwner);
    let key = GrantKey { app, namespace };
    if (reg.grants.contains(&key)) {
        *reg.grants.get_mut(&key) = false;
    };
    event::emit(AccessRevoked {
        registry: object::id(reg),
        owner: reg.owner,
        app,
        namespace,
    });
}

/// Read-only authorization check. The owner is always authorized.
public fun is_authorized(reg: &ConsentRegistry, app: address, namespace: String): bool {
    if (app == reg.owner) {
        return true
    };
    let key = GrantKey { app, namespace };
    reg.grants.contains(&key) && *reg.grants.get(&key)
}

/// Seal access policy. Seal key servers dry-run this with the requester as
/// the transaction sender; it aborts unless they hold a live grant for
/// `namespace`. `id` is the Seal identity bytes (bound by the caller's PTB).
entry fun seal_approve(
    id: vector<u8>,
    reg: &ConsentRegistry,
    namespace: String,
    ctx: &TxContext,
) {
    let _ = id;
    assert!(is_authorized(reg, ctx.sender(), namespace), ENotAuthorized);
}
