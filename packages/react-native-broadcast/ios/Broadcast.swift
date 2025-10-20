import Foundation

@objc
public class BroadcastSwift: NSObject {

    @objc
    public static func multiply(_ a: Double, b: Double) -> NSNumber {
        return NSNumber(value: a * b)
    }
}
