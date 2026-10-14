import jwt from "jsonwebtoken";

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error("JWT_SECRET must be configured with at least 32 characters.");
    }

    return secret;
}

export const generateToken = (userId) => {
    return jwt.sign(
        {
            userId,
        },
        getJwtSecret(),
        {
            expiresIn: "7d",
            algorithm: "HS256",
        }
    );
};

export const verifyToken = (token) => {
    return jwt.verify(token, getJwtSecret(), {
        algorithms: ["HS256"],
    });
};