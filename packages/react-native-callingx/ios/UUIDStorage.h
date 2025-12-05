#import <Foundation/Foundation.h>

@interface UUIDStorage : NSObject

- (instancetype)init;
- (NSUUID *)getOrCreateUUIDForCid:(NSString *)cid;
- (NSUUID *)getUUIDForCid:(NSString *)cid;
- (NSString *)getCidForUUID:(NSUUID *)uuid;
- (void)removeCidForUUID:(NSUUID *)uuid;
- (void)removeCid:(NSString *)cid;
- (void)removeAllObjects;
- (NSUInteger)count;
- (BOOL)containsCid:(NSString *)cid;
- (BOOL)containsUUID:(NSUUID *)uuid;

@end