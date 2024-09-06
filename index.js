import express from "express"
import session from "express-session"
import passport from "passport"
import path from "path"
import process from "process"
const __dirname = process.cwd()
import mongoose from "mongoose"
import { User } from "./models/User.js"
// import { Strategy as LocalStrategy } from "passport-local"
import { check, validationResult } from "express-validator"
const app = express()

app.set("view engine", "ejs")
app.set("views", "./views")
app.use(express.static(path.join(__dirname, "public")))
app.use(
  session({
    secret: "express",
    resave: false,
    saveUninitialized: false,
  })
)
app.use(express.urlencoded({ extended: true }))
app.use(passport.initialize())
app.use(passport.session())
passport.use(User.createStrategy()) //* ここでauthenticateを作る
// passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

mongoose
  .connect("mongodb://localhost:27017/todoApp")
  .then(() => {
    console.log("mongoose Ok!")
  })
  .catch((e) => {
    console.log(e)
  })

const isUser = async (username) => {
  const user = await User.findOne({ username })
  if (!user) {
    return true
  }
  throw new Error("そのユーザーは既に存在します")
}

const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login")
  }
  next()
}

app.get("/", (req, res) => {
  res.render("index")
})

app.get("/signup", (req, res) => {
  res.render("signup")
})

app.post("/signup", [check("username").not().isEmpty(), check("password").not().isEmpty()], async (req, res) => {
  try {
    const { username, password } = req.body
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      //* バリデーションerrorがなかったときに実行
      if (await isUser(username)) {
        const user = new User({ username })
        const saveUser = await User.register(user, password)
        console.log(saveUser)
        req.login(user, (err) => {
          //* ここで作成したユーザーをsessionに保存してログイン
          if (err) {
            return res.status(402).json({ err })
          }
          res.redirect("/todo")
        })
      }
    }
  } catch (e) {
    res.status(404).json({ error: e.message })
  }
})

app.get("/login", (req, res) => {
  const user = req.user
  if (user) {
    res.redirect("/todo")
  }
  res.render("login")
})

app.post("/login", [check("username").not().isEmpty(), check("password").not().isEmpty()], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    // バリデーションエラーの場合
    return res.status(400).json({ errors: errors.array() })
  }

  passport.authenticate("local", (err, user) => {
    if (err) {
      return res.status(500).json({ error: "サーバーエラー" })
    }
    if (!user) {
      return res.status(401).json({ error: "認証失敗" })
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: "ログインエラー" })
      }
      return res.redirect("/todo") // 成功時のリダイレクト
    })
  })(req, res)
})

app.get("/todo", isAuthenticated, (req, res) => {
  res.render("todo", { username: req.user.username })
})

app.listen(3000, () => {
  console.log("http://localhost:3000")
})
