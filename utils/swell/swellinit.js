import Swell from "swell-node"

const swell = Swell.init(process.env.NODE_PUBLIC_SWELL_STORE_ID, process.env.NODE_PUBLIC_SWELL_SECRET_KEY)

export default swell;