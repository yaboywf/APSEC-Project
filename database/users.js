const { Schema, model } = require("mongoose");

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        account_type: {
            type: String,
            enum: ["student", "teacher-assistant", "teacher", "admin"],
            required: true
        },
        password: {
            type: String,
            required: true
        },
        secret_key: {
            type: String,
            required: false
        },
        completed_2fa: {
            type: Boolean,
            required: true
        },
        register_time: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = model("User", UserSchema);