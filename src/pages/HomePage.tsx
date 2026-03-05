import './HomePage.css'

export default function HomePage() {
    return (
        <div className="home-page">
            <section className="hero-section">
                <div className="hero-bg" />
                <div className="hero-content">
                    <h1 className="hero-title">🎵 BiliMusic</h1>
                    <p className="hero-subtitle">从 Bilibili 发现并播放你喜爱的音乐</p>
                    <p className="hero-hint">使用顶部搜索栏开始搜索</p>
                </div>
            </section>

            <section className="section">
                <h2 className="section-title">快速开始</h2>
                <div className="quick-start-cards">
                    <div className="quick-card">
                        <span className="quick-card-icon">🔍</span>
                        <h3>搜索音乐</h3>
                        <p>在搜索栏输入歌曲名称、歌手或关键词</p>
                    </div>
                    <div className="quick-card">
                        <span className="quick-card-icon">▶️</span>
                        <h3>后台播放</h3>
                        <p>仅播放音频，无需加载视频画面</p>
                    </div>
                    <div className="quick-card">
                        <span className="quick-card-icon">📋</span>
                        <h3>创建列表</h3>
                        <p>自建播放列表，管理你的音乐收藏</p>
                    </div>
                </div>
            </section>
        </div>
    )
}
