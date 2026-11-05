#!/bin/bash
# mux picture + code-written sound into the Meta-ready master, then QA sheets
set -e
a=$1; d=out/ad$a
names=([1]=every-match-is-a-battle [2]=one-card-change-the-fight [3]=the-order-fights-back)
mkdir -p final
o=final/ad$a-${names[$a]}-9x16.mp4
ffmpeg -y -loglevel error -i $d/video.mp4 -i $d/mix.wav -map 0:v -map 1:a \
  -vf "scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p" -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:v libx264 -preset slow -crf 17 -profile:v high -r 30 -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest $o
ffmpeg -y -loglevel error -i $o -vf "fps=2,scale=216:-1,tile=8x4" -frames:v 1 $d/contact.png
ffmpeg -i $o -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of csv=p=0 $o
echo $o
