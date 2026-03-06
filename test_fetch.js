async function test() {
    const res = await fetch('https://api.bilibili.com/x/web-interface/wbi/search/all/v2?keyword=' + encodeURIComponent('周杰伦') + '&search_type=video', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    });
    const data = await res.json();
    const videoData = data.data.result.find(r => r.result_type === 'video')?.data || [];
    for (let i = 0; i < 3 && i < videoData.length; i++) {
        const item = videoData[i];
        console.log(`Video ${i}: bvid=${item.bvid}, title=${item.title.replace(/<[^>]+>/g, '')}`);
        if(item.bvid) {
            const detailRes = await fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + item.bvid, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
            });
            const d = await detailRes.json();
            console.log(`  Detail code: ${d.code}, message: ${d.message}, cid: ${d.data?.cid}`);
        }
    }
}
test().catch(console.error);
