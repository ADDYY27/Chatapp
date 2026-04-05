import jwt from 'jsonwebtoken';

const jwtToken = (userid, res) => {
    const token = jwt.sign({ userId: userid }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    res.cookie('jwt', token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development"
    });
};

export default jwtToken;