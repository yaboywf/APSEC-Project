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
            enum: ["student", "teacher-assistant", "teacher", "admin"]
        },
        password: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = model("Member", UserSchema);