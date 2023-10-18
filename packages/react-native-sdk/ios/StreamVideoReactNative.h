@interface StreamVideoReactNative : RCTEventEmitter <RCTBridgeModule>

-(void)screenShareEventReceived:(NSString*)event;

+(void)setup;

@end
