import Foundation

@objcMembers public class UUIDStorage: NSObject {
    private var uuidDict: [String: String] = [:]
    private var cidDict: [String: String] = [:]
    private let queue = DispatchQueue(label: "com.stream.uuidstorage", attributes: [])

    public override init() {
        super.init()
    }

    public func allUUIDs() -> [UUID] {
        return queue.sync {
            return uuidDict.values.compactMap { UUID(uuidString: $0.lowercased()) }
        }
    }

    public func getOrCreateUUID(forCid cid: String) -> UUID {
        return queue.sync {
            // Check if cid exists (inlined to avoid nested sync call)
            if let existingUUID = uuidDict[cid] {
                #if DEBUG
                print("[UUIDStorage] getUUIDForCid: found existing UUID \(existingUUID) for cid \(cid)")
                #endif
                return UUID(uuidString: existingUUID) ?? UUID()
            }

            let uuid = UUID()
            let uuidString = uuid.uuidString.lowercased()
            uuidDict[cid] = uuidString
            cidDict[uuidString] = cid
            #if DEBUG
            print("[UUIDStorage] getUUIDForCid: created new UUID \(uuidString) for cid \(cid)")
            #endif
            return uuid
        }
    }

    public func getUUID(forCid cid: String) -> UUID? {
        return queue.sync {
            guard let uuidString = uuidDict[cid] else { return nil }
            return UUID(uuidString: uuidString)
        }
    }

    public func getCid(forUUID uuid: UUID) -> String? {
        return queue.sync {
            let uuidString = uuid.uuidString.lowercased()
            let cid = cidDict[uuidString]
            #if DEBUG
            print("[UUIDStorage] getCidForUUID: UUID \(uuidString) -> cid \(cid ?? "(not found)")")
            #endif
            return cid
        }
    }

    public func removeCid(forUUID uuid: UUID) {
        queue.sync {
            let uuidString = uuid.uuidString.lowercased()
            if let cid = cidDict[uuidString] {
                uuidDict.removeValue(forKey: cid)
                cidDict.removeValue(forKey: uuidString)
                #if DEBUG
                print("[UUIDStorage] removeCidForUUID: removed cid \(cid) for UUID \(uuidString)")
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
            if let uuidString = uuidDict[cid] {
                cidDict.removeValue(forKey: uuidString)
                uuidDict.removeValue(forKey: cid)
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
            let count = uuidDict.count
            uuidDict.removeAll()
            cidDict.removeAll()
            #if DEBUG
            print("[UUIDStorage] removeAllObjects: cleared \(count) entries")
            #endif
        }
    }

    public func count() -> Int {
        return queue.sync {
            return uuidDict.count
        }
    }

    public func containsCid(_ cid: String) -> Bool {
        return queue.sync {
            return uuidDict[cid] != nil
        }
    }

    public func containsUUID(_ uuid: UUID) -> Bool {
        return queue.sync {
            return cidDict[uuid.uuidString.lowercased()] != nil
        }
    }

    public override var description: String {
        return queue.sync {
            return "UUIDStorage: \(uuidDict)"
        }
    }
}
