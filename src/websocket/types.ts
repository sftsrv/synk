import { type Push } from "../async/types"
import { type Reference } from "../types"

export type OnReceived<T extends Reference> = (changes: Push<T>) => void
