const crypto = require("crypto");
const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const DOCUMENT_ROOT = __dirname;

// トークンを作成する際の秘密鍵
const SECRET_TOKEN = "abcdefghijklmn12345";

// チャット参加者一覧
const MEMBER = {};
// ↑以下のような内容のデータが入る
// {
//   "socket.id": {token:"abcd", name:"foo", count:1},
//   "socket.id": {token:"efgh", name:"bar", count:2}
// }

// チャット延べ参加者数
let MEMBER_COUNT = 1;

/**
 * "/"にアクセスがあったらindex.htmlを返却
 */
app.get("/", (req, res) => {
    res.sendFile(DOCUMENT_ROOT + "/index.html");
});
app.get("/:file", (req, res) => {
    res.sendFile(DOCUMENT_ROOT + "/" + req.params.file);
});

/**
 * [イベント] ユーザーが接続
 */
io.on("connection", (socket) => {
    console.log("ユーザーが接続しました");

    // ログイン
    (() => {
        // トークンを作成
        const token = makeToken(socket.id);

        // ユーザーリストに追加
        MEMBER[socket.id] = { token: token, name: null, count: MEMBER_COUNT };
        MEMBER_COUNT++;

        // 本人にトークンを送付
        io.to(socket.id).emit("token", { token: token });
    })();

    /**
     * [イベント] 入室する
     */
    socket.on("join", (data) => {
        console.log(data);
        //--------------------------
        // トークンが正しければ
        //--------------------------
        if (authToken(socket.id, data.token)) {
            // 入室OK + 現在の入室者一覧を通知
            const memberlist = getMemberList();
            io.to(socket.id).emit("join-result", { status: true, list: memberlist });

            // メンバー一覧に追加
            MEMBER[socket.id].name = data.name;

            // 入室通知
            io.to(socket.id).emit("member-join", data);
            socket.broadcast.emit("member-join", { name: data.name, token: MEMBER[socket.id].count });
        }
        //--------------------------
        // トークンが誤っていた場合
        //--------------------------
        else {
            // 本人にNG通知
            io.to(socket.id).emit("join-result", { status: false });
        }
    });

    socket.on("post", (data) => {
        console.log(data);
        if (authToken(socket.id, data.token)) {
            // 本人に通知
            io.to(socket.id).emit("member-post", data);

            // 本人以外に通知
            socket.broadcast.emit("member-post", { text: data.text, token: MEMBER[socket.id].count });
        } else {
            // トークンが誤っていた場合は無視する
        }
    });

    /**
     * [イベント] 退室する
     */
    socket.on("quit", (data) => {
        console.log(data);
        //--------------------------
        // トークンが正しければ
        //--------------------------
        if (authToken(socket.id, data.token)) {
            // 本人に通知
            io.to(socket.id).emit("quit-result", { status: true });

            // 本人以外に通知
            socket.broadcast.emit("member-quit", { token: MEMBER[socket.id].count });

            // 削除
            delete MEMBER[socket.id];
        }
        //--------------------------
        // トークンが誤っていた場合
        //--------------------------
        else {
            // 本人にNG通知
            io.to(socket.id).emit("quit-result", { status: false });
        }
    });
});

/**
 * 3000番でサーバを起動する
 */
http.listen(3000, () => {
    console.log("listening on *:3000");
});

/**
 * トークンを作成する
 *
 * @param  {string} id - socket.id
 * @return {string}
 */
function makeToken(id) {
    const str = SECRET_TOKEN + id;
    return (crypto.createHash("sha1").update(str).digest('hex'));
}

/**
 * 本人からの通信か確認する
 *
 * @param {string} socketid
 * @param {string} token
 * @return {boolean}
 */
function authToken(socketid, token) {
    return (
        (socketid in MEMBER) && (token === MEMBER[socketid].token)
    );
}

/**
 * メンバー一覧を作成する
 *
 * @return {array}
 */
function getMemberList() {
    const list = [];
    for (let key in MEMBER) {
        const cur = MEMBER[key];
        if (cur.name !== null) {
            list.push({ token: cur.count, name: cur.name });
        }
    }
    return (list);
}
