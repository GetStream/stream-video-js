set -e

OUT_DIR="gen"
rm -rf $OUT_DIR && mkdir -p $OUT_DIR

npx protoc \
  --ts_out $OUT_DIR \
  --ts_opt long_type_string \
  --ts_opt generate_dependencies \
  --ts_opt client_generic \
  --ts_opt server_none \
  --proto_path protobuf \
  protobuf/video_coordinator_rpc/coordinator_service.proto
