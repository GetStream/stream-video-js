require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "Callingx"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  # LiveCommunicationKit requires iOS 17.4
  s.platforms    = { :ios => "17.4" }
  s.source       = { :git => "https://github.com/GetStream/stream-video-js/tree/main/packages/react-native-callingx.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/CallingxModule.h"
  s.public_header_files = "ios/CallingxPublic.h", "ios/VoipPushHandler.h"
  s.swift_version = "5.0"

  s.dependency "stream-react-native-webrtc"

  install_modules_dependencies(s)
end
