require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "StreamReactNativeBroadcast"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/GetStream/stream-video-js.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,cpp,swift}"
  s.private_header_files = "ios/**/*.h"

  install_modules_dependencies(s)

  spm_dependency(s,
    url: 'https://github.com/HaishinKit/HaishinKit.swift',
    requirement: { kind: 'upToNextMajorVersion', minimumVersion: '2.2.0' },
    products: ['HaishinKit', 'RTMPHaishinKit', 'SRTHaishinKit', 'MoQTHaishinKit', 'RTCHaishinKit']
  )
end
