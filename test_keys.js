async function test() {
    const sr = await fetch('https://api.bilibili.com/x/web-interface/wbi/search/all/v2?keyword=' + encodeURIComponent('周杰伦') + '&search_type=video', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
    });
    const data = await sr.json();
    const vData = data.data?.result?.find(r => r.result_type === 'video')?.data || [];
    if(vData.length > 0) {
        console.log(vData[0]);
    }
}
test().catch(console.error);
