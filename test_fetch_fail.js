async function test() {
    const queries = ['周杰伦', '孤勇者', '起风了'];
    for(const q of queries) {
        const sr = await fetch('https://api.bilibili.com/x/web-interface/wbi/search/all/v2?keyword=' + encodeURIComponent(q) + '&search_type=video', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
        });
        const data = await sr.json();
        const vData = data.data?.result?.find(r => r.result_type === 'video')?.data || [];
        for (let i = 0; i < 5 && i < vData.length; i++) {
            const item = vData[i];
            const detailRes = await fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + item.bvid, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
            });
            const d = await detailRes.json();
            if (d.code !== 0 || !d.data?.cid) {
                console.log(`Failed! term: ${q}, title: ${item.title.replace(/<[^>]+>/g, '')}, bvid: ${item.bvid}, code: ${d.code}, message: ${d.message}`);
                console.log('Original search item keys:', Object.keys(item));
                console.log('Is there a cid?', item.cid);
            }
        }
    }
}
test().catch(console.error);
