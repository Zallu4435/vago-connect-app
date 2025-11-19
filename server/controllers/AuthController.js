import getPrismaInstance from "../utils/PrismaClient.js";

export const checkUser = async (req, res, next) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ message: "Email is required", status: false })
        }

        const prisma = getPrismaInstance()

        const user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
            return res.status(200).json({ message: "User not found", status: false })
        }

        return res.status(200).json({ message: "User found", status: true, user })

    } catch (error) {
        next(error)
    }
}

export const onBoardUser = async (req, res, next) => {
    try {
        const { name, email, about, image } = req.body

        if (!name || !email || typeof image !== 'string') {
            return res.status(400).json({ message: "Name, email, about and image are required", status: false })
        }

        const prisma = getPrismaInstance()

        const user = await prisma.user.create({ data: { name, email, about: about || "", image } })

        return res.status(200).json({ message: "User created", status: true, user })
    } catch (error) {
        next(error)
    }
}

export const getAllUser = async (req, res, next) => {
    try {
        const prisma = getPrismaInstance()
        const users = await prisma.user.findMany({
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                email: true,
                about: true,
                image: true,
            }
        })

        const usersGroupByInitialLetters = users.reduce((acc, user) => {
            const initial = user.name.charAt(0).toUpperCase();
            if (!acc[initial]) {
                acc[initial] = [];
            }
            acc[initial].push(user);
            return acc;
        }, {});

        return res.status(200).json({ message: "Users found", status: true, users: usersGroupByInitialLetters });
    } catch (error) {
        next(error)
    }
}