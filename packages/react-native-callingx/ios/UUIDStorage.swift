import Foundation

@objcMembers public class UUIDStorage: NSObject {
    private var uuidDict: [String: String] = [:]
    private var cidDict: [String: String] = [:]

    public override init() {
        super.init()
    }

    public func allUUIDs() -> [UUID] {
        return uuidDict.values.compactMap { UUID(uuidString: $0.lowercased()) }
    }

    public func getOrCreateUUID(forCid cid: String) -> UUID {
        if containsCid(cid) {
            if let existingUUID = uuidDict[cid] {
                #if DEBUG
                print("[UUIDStorage] getUUIDForCid: found existing UUID \(existingUUID) for cid \(cid)")
                #endif
                return UUID(uuidString: existingUUID) ?? UUID()
            }
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

    public func getUUID(forCid cid: String) -> UUID? {
        guard let uuidString = uuidDict[cid] else { return nil }
        return UUID(uuidString: uuidString)
    }

    public func getCid(forUUID uuid: UUID) -> String? {
        let uuidString = uuid.uuidString.lowercased()
        let cid = cidDict[uuidString]
        #if DEBUG
        print("[UUIDStorage] getCidForUUID: UUID \(uuidString) -> cid \(cid ?? "(not found)")")
        #endif
        return cid
    }

    public func removeCid(forUUID uuid: UUID) {
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

    public func removeCid(_ cid: String) {
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

    public func removeAllObjects() {
        let count = uuidDict.count
        uuidDict.removeAll()
        cidDict.removeAll()
        #if DEBUG
        print("[UUIDStorage] removeAllObjects: cleared \(count) entries")
        #endif
    }

    public func count() -> Int {
        return uuidDict.count
    }

    public func containsCid(_ cid: String) -> Bool {
        return uuidDict[cid] != nil
    }

    public func containsUUID(_ uuid: UUID) -> Bool {
        return cidDict[uuid.uuidString.lowercased()] != nil
    }

    public override var description: String {
        return "UUIDStorage: \(uuidDict)"
    }
}
