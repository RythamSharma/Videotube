import mongoose, {Schema} from "mongoose";


const WatchlaterSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    addedby: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    
}, {timestamps: true})

export const Watchlater = mongoose.model("Watchlater", WatchlaterSchema)