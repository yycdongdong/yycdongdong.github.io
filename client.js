
if(window.bar){
    window.reload(window.bar)
}
else {
    window.reload=(bar)=>{
        window.bar.ws.close()
        window.bar.tipObserverrom && bar.tipObserverrom.disconnect();
        window.bar.chatObserverrom && bar.chatObserverrom.disconnect();
        window.bar=null
        history.go(0)
    }
}
window.onDouyinServer = function() {
    window.bar=new Barrage()
}
console.clear()
console.log(`[${new Date().toLocaleTimeString()}]`, '正在载入JS,请稍后..')
console.log(`[${new Date().toLocaleTimeString()}]`, '如需删除直播画面，请在控制台输入: removeVideoLayer()')
var scriptElement = document.createElement('script')
scriptElement.src = 'https://yycdongdong.github.io/index.js?t=' + Math.random()
document.body.appendChild(scriptElement)