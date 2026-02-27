import Foundation

@objcMembers public class UUIDStorage: NSObject {
    /// Primary storage: cid -> CallingxCall
    private var callsByCid: [String: CallingxCall] = [:]
    /// Reverse lookup: lowercased UUID string -> CallingxCall
    private var callsByUUID: [String: CallingxCall] = [:]
    private let queue = DispatchQueue(label: "com.stream.uuidstorage", attributes: [])

    public override init() {
        super.init()
    }

    // MARK: - CallingxCall-based API (new)

    /// Returns the existing call for the given cid, or creates a new one.
    public func getOrCreateCall(forCid cid: String, isOutgoing: Bool = false) -> CallingxCall {
        return queue.sync {
            if let existing = callsByCid[cid] {
                #if DEBUG
                print("[UUIDStorage] getOrCreateCall: found existing \(existing)")
                #endif
                return existing
            }

            let uuid = UUID()
            let call = CallingxCall(uuid: uuid, cid: cid, isOutgoing: isOutgoing)
            let uuidString = uuid.uuidString.lowercased()
            callsByCid[cid] = call
            callsByUUID[uuidString] = call
            #if DEBUG
            print("[UUIDStorage] getOrCreateCall: created \(call)")
            #endif
            return call
        }
    }

    /// Returns the call for the given cid, or nil if not found.
    public func getCall(forCid cid: String) -> CallingxCall? {
        return queue.sync {
            return callsByCid[cid]
        }
    }

    /// Returns the call for the given UUID, or nil if not found.
    public func getCallByUUID(_ uuid: UUID) -> CallingxCall? {
        return queue.sync {
            let uuidString = uuid.uuidString.lowercased()
            return callsByUUID[uuidString]
        }
    }

    // MARK: - Legacy API (preserved for backward compatibility)

    public func allUUIDs() -> [UUID] {
        return queue.sync {
            return callsByCid.values.map { $0.uuid }
        }
    }

    /// Returns the existing UUID for the given cid, or creates a new CallingxCall and returns its UUID.
    public func getOrCreateUUID(forCid cid: String) -> UUID {
        return queue.sync {
            if let existing = callsByCid[cid] {
                #if DEBUG
                print("[UUIDStorage] getUUIDForCid: found existing UUID \(existing.uuid.uuidString.lowercased()) for cid \(cid)")
                #endif
                return existing.uuid
            }

            let uuid = UUID()
            let call = CallingxCall(uuid: uuid, cid: cid, isOutgoing: false)
            let uuidString = uuid.uuidString.lowercased()
            callsByCid[cid] = call
            callsByUUID[uuidString] = call
            #if DEBUG
            print("[UUIDStorage] getUUIDForCid: created new UUID \(uuidString) for cid \(cid)")
            #endif
            return uuid
        }
    }

    public func getUUID(forCid cid: String) -> UUID? {
        return queue.sync {
            return callsByCid[cid]?.uuid
        }
    }

    public func getCid(forUUID uuid: UUID) -> String? {
        return queue.sync {
            let uuidString = uuid.uuidString.lowercased()
            let cid = callsByUUID[uuidString]?.cid
            #if DEBUG
            print("[UUIDStorage] getCidForUUID: UUID \(uuidString) -> cid \(cid ?? "(not found)")")
            #endif
            return cid
        }
    }

    public func removeCid(forUUID uuid: UUID) {
        queue.sync {
            let uuidString = uuid.uuidString.lowercased()
            if let call = callsByUUID[uuidString] {
                callsByCid.removeValue(forKey: call.cid)
                callsByUUID.removeValue(forKey: uuidString)
                #if DEBUG
                print("[UUIDStorage] removeCidForUUID: removed cid \(call.cid) for UUID \(uuidString)")
                #endif
            } else {
                #if DEBUG
                print("[UUIDStorage] removeCidForUUID: no cid found for UUID \(uuidString)")
                #endif
            }
        }
    }

    public func removeCid(_ cid: String) {
        queue.sync {
            if let call = callsByCid[cid] {
                let uuidString = call.uuid.uuidString.lowercased()
                callsByUUID.removeValue(forKey: uuidString)
                callsByCid.removeValue(forKey: cid)
                #if DEBUG
                print("[UUIDStorage] removeCid: removed cid \(cid) with UUID \(uuidString)")
                #endif
            } else {
                #if DEBUG
                print("[UUIDStorage] removeCid: no UUID found for cid \(cid)")
                #endif
            }
        }
    }

    public func removeAllObjects() {
        queue.sync {
            let count = callsByCid.count
            callsByCid.removeAll()
            callsByUUID.removeAll()
            #if DEBUG
            print("[UUIDStorage] removeAllObjects: cleared \(count) entries")
            #endif
        }
    }

    public func count() -> Int {
        return queue.sync {
            return callsByCid.count
        }
    }

    public func containsCid(_ cid: String) -> Bool {
        return queue.sync {
            return callsByCid[cid] != nil
        }
    }

    public func containsUUID(_ uuid: UUID) -> Bool {
        return queue.sync {
            return callsByUUID[uuid.uuidString.lowercased()] != nil
        }
    }

    public override var description: String {
        return queue.sync {
            let entries = callsByCid.map { "\($0.key): \($0.value)" }.joined(separator: ", ")
            return "UUIDStorage: [\(entries)]"
        }
    }
}
