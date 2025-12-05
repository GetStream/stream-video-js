#import "UUIDStorage.h"

@interface UUIDStorage ()
@property (nonatomic, strong) NSMutableDictionary *uuidDict;
@property (nonatomic, strong) NSMutableDictionary *cidDict;
@end

@implementation UUIDStorage

- (instancetype)init {
    self = [super init];
    if (self) {
        _uuidDict = [[NSMutableDictionary alloc] init];
        _cidDict = [[NSMutableDictionary alloc] init];
    }
    return self;
}

- (NSUUID *)getOrCreateUUIDForCid:(NSString *)cid {
  if ([self containsCid:cid]) {
    NSString *existingUUID = self.uuidDict[cid];
    NSLog(@"[UUIDStorage] getUUIDForCid: found existing UUID %@ for cid %@", existingUUID, cid);
    return [[NSUUID alloc] initWithUUIDString:existingUUID];
  }

  NSUUID *uuid = [NSUUID UUID];
  NSString *uuidString = [uuid.UUIDString lowercaseString];
  self.uuidDict[cid] = uuidString;
  self.cidDict[uuidString] = cid;
  NSLog(@"[UUIDStorage] getUUIDForCid: created new UUID %@ for cid %@", uuidString, cid);
  
  return uuid;
}

- (NSUUID *)getUUIDForCid:(NSString *)cid {
  NSString *uuidString = self.uuidDict[cid];
  if (uuidString) {
    return [[NSUUID alloc] initWithUUIDString:uuidString];
  }
  return nil;
}

- (NSString *)getCidForUUID:(NSUUID *)uuid {
  NSString *uuidString = [uuid.UUIDString lowercaseString];
  NSString *cid = self.cidDict[uuidString];
  NSLog(@"[UUIDStorage] getCidForUUID: UUID %@ -> cid %@", uuidString, cid ?: @"(not found)");
  return cid;
}

- (void)removeCidForUUID:(NSUUID *)uuid {
  NSString *uuidString = [uuid.UUIDString lowercaseString];
  NSString *cid = self.cidDict[uuidString];
  if (cid) {
    [self.uuidDict removeObjectForKey:cid];
    [self.cidDict removeObjectForKey:uuidString];
    NSLog(@"[UUIDStorage] removeCidForUUID: removed cid %@ for UUID %@", cid, uuidString);
  } else {
    NSLog(@"[UUIDStorage] removeCidForUUID: no cid found for UUID %@", uuidString);
  }
}

- (void)removeCid:(NSString *)cid {
  NSString *uuidString = self.uuidDict[cid];
  if (uuidString) {
    [self.cidDict removeObjectForKey:uuidString];
    [self.uuidDict removeObjectForKey:cid];
    NSLog(@"[UUIDStorage] removeCid: removed cid %@ with UUID %@", cid, uuidString);
  } else {
    NSLog(@"[UUIDStorage] removeCid: no UUID found for cid %@", cid);
  }
}

- (void)removeAllObjects {
  NSUInteger count = [self.uuidDict count];
  [self.uuidDict removeAllObjects];
  [self.cidDict removeAllObjects];
  NSLog(@"[UUIDStorage] removeAllObjects: cleared %lu entries", (unsigned long)count);
}

- (NSUInteger)count {
    return [self.uuidDict count];
}

- (BOOL)containsCid:(NSString *)cid {
    return self.uuidDict[cid] != nil;
}

- (BOOL)containsUUID:(NSUUID *)uuid {
    return self.cidDict[[uuid.UUIDString lowercaseString]] != nil;
}

- (NSString *)description {
    return [NSString stringWithFormat:@"UUIDStorage: %@", self.uuidDict];
}

@end