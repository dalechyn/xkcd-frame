import { Button, Frog } from 'frog'
import { handle } from 'frog/vercel'
import {imageSize} from 'image-size'

const APP_URL = 'https://xkcd-frame.xyz'

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  imageAspectRatio: '1:1',
  imageOptions: {height: 1000, width: 1000, fonts: [], headers: {'Cache-Control': 'max-age=0'}}
})

const MAX_XKCD_POST_ID = 2906

function getRandomXkcdId() {
  return Math.floor(Math.random() * (MAX_XKCD_POST_ID + 1))
}

type XkcdPost = {
  month: string
  num: number
  link: string
  year: string
  news: string
  safe_title: string
  transcript: string
  alt: string
  img: string
  title: string
  day: string
}

app.get('/', (c) => c.redirect(`${APP_URL}/api/post/${getRandomXkcdId()}`))

app.frame('/post/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (id < 0 || id > MAX_XKCD_POST_ID) return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          There is no xkcd post with id ${id} :(.
          Max id is {MAX_XKCD_POST_ID}
        </div>
      </div>
    ),
    intents: [
      <Button action={`/${getRandomXkcdId()}`}>Random</Button>,
    ],
  })

  const post: XkcdPost = await fetch(`https://xkcd.com/${id}/info.0.json`).then(r => r.json())
  const imageArrayBuffer = await fetch(post.img).then(res => res.arrayBuffer())
  const {height: originalHeight, width: originalWidth} = imageSize(new Uint8Array(imageArrayBuffer))

  if (!originalHeight || !originalWidth) throw new Error('bad image')

  let normalizedHeight:number = 1000
  let normalizedWidth:number = 1000
  const aspectRatio = originalWidth / originalHeight
  if (originalHeight < originalWidth) {
    normalizedHeight = 1000 / aspectRatio
    normalizedWidth = 1000
  } else {
    normalizedHeight = 1000 
    normalizedWidth = 1000* aspectRatio
  }

  return c.res({
    image: (
      <div tw="flex h-full w-full bg-[#fff]">
        <div tw="flex h-full w-full p-4 items-center justify-center">
          <img src={post.img} height={normalizedHeight - 4*4} width={normalizedWidth - 4*4} />
        </div>
      </div>
    ),
    intents: [
      <Button action={`/post/${id-1}`}>Prev</Button>,
      <Button action={`/post/${getRandomXkcdId()}`}>Random</Button>,
      <Button action={`/post/${id+1}`}>Next</Button>,
      <Button.Link href={`https://warpcast.com/~/compose?embeds[]=${APP_URL}/api/post/${id}`}>Share</Button.Link>,
    ],
  })
})

export const GET = handle(app)
export const POST = handle(app)
