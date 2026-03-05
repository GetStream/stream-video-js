require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "stream-io-noise-cancellation-react-native"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => '13.0' }
  s.source       = { :git => "https://github.com/GetStream/stream-video-js.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.dependency "stream-react-native-webrtc"
  s.dependency 'StreamVideoNoiseCancellation'

  public_header_files = 'ios/Headers/*.h'
  # Swift/Objective-C compatibility https://blog.cocoapods.org/CocoaPods-1.5.0/
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  install_modules_dependencies(s)
end
