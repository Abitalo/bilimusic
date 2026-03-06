const axios = require('axios');
async function test() {
    const res = await axios.get('https://api.bilibili.com/x/web-interface/wbi/search/all/v2?keyword=' + encodeURIComponent('周杰伦') + '&search_type=video', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    // try different search terms
    const queries = ['孤勇者', '起风了', '周杰伦 稻香'];
    for(const q of queries) {
        const sr = await axios.get('https://api.bilibili.com/x/web-interface/wbi/search/all/v2?keyword=' + encodeURIComponent(q) + '&search_type=video', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const vData = sr.data.data.result.find(r => r.result_type === 'video')?.data || [];
        for (let i = 0; i < 5 && i < vData.length; i++) {
            const item = vData[i];
            const detailRes = await axios.get('https://api.bilibili.com/x/web-interface/view?bvid=' + item.bvid, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, validateStatus: () => true
            });
            const d = detailRes.data;
            if (d.code !== 0 || !d.data?.cid) {
                console.log(`Failed! term: ${q}, title: ${item.title.replace(/<[^>]+>/g, '')}, bvid: ${item.bvid}, code: ${d.code}, message: ${d.message}, pgcurl: ${d.data?.redirect_url}`);
                // let's see what the original item has
                console.log('Original search item keys:', Object.keys(item));
                console.log('Is there a cid?', item.cid);
            }
        }
    }
}
test().catch(console.error);
