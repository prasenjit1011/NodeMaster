import express, { Request, Response, NextFunction } from "express";
import fs from "fs-extra";
import path from "path";

const router = express.Router();

// const itemsFilePath = path.join(__dirname, '..', '..', 'data', 'items.json');
const itemsFilePath = path.join(process.cwd(), "data", "items.json");

// ================================
// Helper Functions
// ================================
const readItems = async () => {
    const data = await fs.readFile(itemsFilePath, 'utf-8');
    return JSON.parse(data);
};

const writeItems = async (items: any) => {
    await fs.writeFile(itemsFilePath, JSON.stringify(items, null, 2));
};


// ================================
// Create Item
// ================================
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {

        const items = await readItems();

        const newItem = {
            id: Date.now(),
            name: req.body.name,
            createdAt: new Date().toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata'
            })
        };

        items.push(newItem);

        await writeItems(items);

        res.status(201).json({
            success: true,
            message: 'Item Created',
            data: newItem
        });

    }
    catch (err) {
        next(err);
    }
});


// ================================
// Get All Items
// ================================
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {

        const items = await readItems();
        console.log(items);


        res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });

    }
    catch (err) {
        next(err);
    }
});


// ================================
// Get Single Item
// ================================
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {

        const items = await readItems();

        const item = items.find((x: any) => x.id == req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item Not Found'
            });
        }

        res.status(200).json({
            success: true,
            data: item
        });

    }
    catch (err) {
        next(err);
    }
});


// ================================
// Update Item
// ================================
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {

        const items = await readItems();

        const itemIndex = items.findIndex((x: any) => x.id == req.params.id);

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item Not Found'
            });
        }

        items[itemIndex].name = req.body.name;

        items[itemIndex].updatedAt = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata'
        });

        await writeItems(items);

        res.status(200).json({
            success: true,
            message: 'Item Updated',
            data: items[itemIndex]
        });

    }
    catch (err) {
        next(err);
    }
});


// ================================
// Delete Item
// ================================
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {

        const items = await readItems();

        const filteredItems = items.filter((x: any) => x.id != req.params.id);

        await writeItems(filteredItems);

        res.status(200).json({
            success: true,
            message: 'Item Deleted'
        });

    }
    catch (err) {
        next(err);
    }
});

export default router;