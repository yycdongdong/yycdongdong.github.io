// 测试
// window.onDouyinServer = function() {
//     new Barrage({ message: false })
// }

const Barrage = class {
    wsurl = "wss://www.randream.vip/ws/v2/"
    timer = null
    timeinterval = 3 * 1000 // 断线重连轮询间隔
    propsId = null
    chatDom = null
    roomJoinDom = null
    ws = null
    tipObserverrom = null
    chatObserverrom = null
    option = {}
    event = {}
    eventRegirst = {}
    constructor(option = { message: true }) {
        this.option = option
        let { link, removePlay } = option
        if (link) {
            this.wsurl = link
        }
        if (removePlay) {
            document.querySelector('.basicPlayer').remove()
        }
        this.propsId = Object.keys(document.querySelector('.webcast-chatroom___list'))[1]
        this.chatDom = document.querySelector('.webcast-chatroom___items').children[0]
        this.roomJoinDom = document.querySelector('.webcast-chatroom___bottom-message')
        this.ws = new WebSocket(this.wsurl)
        this.ws.onclose = this.wsClose
        this.ws.onopen = () => {
            this.openWs()
        }
    }

    // 消息事件 , join, message
    on(e, cb) {
        this.eventRegirst[e] = true
        this.event[e] = cb
    }
    openWs() {
        console.log(`[${new Date().toLocaleTimeString()}]`, '服务已经连接成功!')
        clearInterval(this.timer)
        this.runServer()
    }
    wsClose() {
        console.log('服务器断开')
        if (this.timer !== null) {
            return
        }
        this.tipObserverrom && this.tipObserverrom.disconnect();
        this.chatObserverrom && this.chatObserverrom.disconnect();
        this.timer = setInterval(() => {
            console.log('正在等待服务器启动..')
            this.ws = new WebSocket(wsurl);
            console.log('状态 ->', this.ws.readyState)
            setTimeout(() => {
                if (this.ws.readyState === 1) {
                    openWs()
                }
            }, 2000)

        }, this.timeinterval)
    }
    runServer() {
        let _this = this
        if (!this.option.tipObserver) {
            this.tipObserverrom = new MutationObserver((mutationsList) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length) {
                        let dom = mutation.addedNodes[0]
                       //#region
                       // let user = dom[this.propsId].children.props.message.payload.user
                       // let userinfo = {
                       //     ...this.getUser(user),
                       //     ... { msg_content: `${user.nickname} 来了` }
                       // }
                       //#endregion
                       console.log(dom[this.propsId])
                       if (dom[this.propsId].children&&dom[this.propsId].children.props.message) {
                            let message = this.messageParse(dom)
                            if (message) {
                                 this.ws.send(JSON.stringify({ method: 'message', message:message}));
                            }
                            else{
                             this.ws.send(JSON.stringify({ method: 'message', message: null })); 
                             }
                        }
                    }
                }
            });
            this.tipObserverrom.observe(this.roomJoinDom, { childList: true });
        }
        
        if (!_this.option.chatObserver) {
            this.chatObserverrom = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length) {
                        let dom = mutation.addedNodes[0]
                        if (dom[this.propsId].children.props.message) {
                            let message = this.messageParse(dom)
                            if (message) {
                                this.ws.send(JSON.stringify({ method: 'message', message: message }));
                            }
                            else{
                                this.ws.send(JSON.stringify({ method: 'message', message: null })); 
                            }
                        }
                        
                    }
                }
            });
            this.chatObserverrom.observe(this.chatDom, { childList: true });
        }

    }
    getUser(user) {
        if (!user) {
            return
        }
        let msg = {
            user_level: this.getLevel(user.badge_image_list, 1),
            user_fansLevel: this.getLevel(user.badge_image_list, 7),
            user_id: user.id,
            user_nickName: user.nickname,
            user_avatar: user.avatar_thumb.url_list[0],
            user_gender: user.gender === 1 ? '男' : '女',
            user_isAdmin: user.user_attr.is_admin,//,
            //user_fansLightName: "",
            //user_levelImage: ""
        }
        return msg
    }
    getLevel(arr, type) {
        if (!arr || arr.length === 0) {
            return 0
        }
        let item = arr.find(i => {
            return i.image_type === type
        })
        if (item) {
            return {
                "alternative_text":item.content.alternative_text,
                "level":parseInt(item.content.level)
            }
        } 
        else {
            return {
                "alternative_text":"",
                "level":0
            }
        }
    }
    messageParse(dom) {
        if (!dom[this.propsId].children.props.message) {
            return null
        }
        let msg = dom[this.propsId].children.props.message.payload
        //let result = {
        //    repeatCount: null,
        //    gift_id: null,
        //    gift_name: null,
        //    gift_number: null,
        //    gift_image: null,
        //    gift_diamondCount: null,
        //    gift_describe: null,
        //}
        let result={}
        if(msg.user){
           // result = Object.assign(result, this.getUser(msg.user))
        }
        switch (msg.common.method) {
            case 'WebcastGiftMessage':
                console.log("WebcastGiftMessage",dom[this.propsId])
               result = Object.assign(result, {
                   method:"WebcastGiftMessage",
                   msg_content:msg.user.nickname+": "+ msg.gift.describe+"*"+msg.repeat_count,
                   //gift_id: msg.gift.id,
                   //gift_name: msg.gift.name,
                   //gift_number: parseInt(msg.repeat_count),
                   //gift_image: msg.gift.icon.url_list[0],
                   //gift_describe: msg.gift.describe,
               })
                break
            case 'WebcastChatMessage':
                console.log('WebcastChatMessage',dom[this.propsId])
                result = Object.assign(result, {
                    method:"WebcastChatMessage",
                    msg_content: msg.user.nickname+": "+msg.content
                })
                break
            case "WebcastRoomMessage":
                console.log("WebcastRoomMessage",msg)
                switch(msg.biz_scene){
                    case "level_up_msg":
                        result = Object.assign(result,{
                            method: "WebcastRoomMessage-level_up_msg",
                            msg_content:"恭喜"+msg.common.display_text.pieces[0].user_value.user.nickname+"刚刚升级至Lv."+msg.buried_point.level
                        })
                        break
                    case "social_recommend":
                        result = Object.assign(result,{
                            method: "WebcastRoomMessage-social_recommend",
                            msg_content:msg.common.display_text.pieces[0].user_value.user.nickname+"推荐直播给Ta的朋友"
                        })
                        break
                    default:
                        result = Object.assign(result,{
                            method: "WebcastRoomMessage-default",
                            msg_content:msg.content
                        })
                        break
                }
                break
            case "WebcastMemberMessage":
                console.log("WebcastMemberMessage",dom[this.propsId])
                result=Object.assign(result,{
                    method:"WebcastMemberMessage",
                    msg_content:`${msg.user.nickname}来了,欢迎!当前本场观众数:${msg.member_count}`
                })
                break
            case "WebcastLikeMessage":
                switch(msg.common.display_text.key){
                    case "room_like_common_text":
                        result=Object.assign(result,{
                            method:"WebcastLikeMessage-room_like_common_text",
                            msg_content:`${msg.user.nickname}为主播点赞了,当前本场点赞数:${msg.total}`
                        })
                        break
                }
                break
            case "WebcastFansclubMessage":
                console.log("WebcastFansclubMessage",msg)
                result=Object.assign(result,{
                    method:"WebcastFansclubMessage",
                    msg_content:msg.content
                })
                break
            case "WebcastRoomStatsMessage":
                console.log("WebcastRoomStatsMessage",msg)
                result=Object.assign(result,{
                    method:"WebcastRoomStatsMessage",
                    msg_content:msg
                })
                break
            case "WebcastExhibitionChatMessage":
                switch(msg.common.display_text.key){
                    case "exhibition_naming_chat_message_v2":
                        console.log("WebcastExhibitionChatMessage",msg)
                        result=Object.assign(result,{
                            method:"WebcastExhibitionChatMessage-exhibition_naming_chat_message_v2",
                            msg_content:msg.common.display_text.pieces[0].user_value.user.nickname+"成功冠名了"+`榜${msg.biz_type}`
                        })
                        break
                }
                break
            default:
                console.log('default',msg)
                result = Object.assign(result, {
                    method:'default',
                    msg_content: msg.content
                })
                break
        }
        return result
    }
}

if (window.onDouyinServer) {
    window.onDouyinServer()
}

window.removeVideoLayer = function() {
    document.querySelector('.basicPlayer').remove()
    console.log('删除画面成功,不影响弹幕信息接收')
}