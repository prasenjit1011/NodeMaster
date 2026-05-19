import { createProduct, getProducts } from "../../src/controllers/product.controller";
import { Product } from "../../src/models/product.model";

// ================================
// MOCK MONGOOSE MODEL
// ================================
jest.mock("../../src/models/product.model");

const mockedProduct = Product as unknown as {
    create: jest.Mock;
    find: jest.Mock;
};

// ================================
// MOCK EXPRESS RESPONSE
// ================================
const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe("Product Controller (MongoDB Model)", () => {

    // =========================
    // CREATE PRODUCT - SUCCESS
    // =========================
    it("should create a product successfully", async () => {
        const req: any = {
            body: {
                name: "Laptop",
                price: 60000,
            },
        };

        const res = mockResponse();

        const fakeProduct = {
            _id: "abc123",
            name: "Laptop",
            price: 60000,
        };

        mockedProduct.create.mockResolvedValue(fakeProduct as any);

        await createProduct(req, res);

        expect(mockedProduct.create).toHaveBeenCalledWith({
            name: "Laptop",
            price: 60000,
        });

        expect(res.status).toHaveBeenCalledWith(201);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Product created",
                data: fakeProduct,
            })
        );
    });

    // =========================
    // CREATE PRODUCT - ERROR
    // =========================
    it("should handle error in createProduct", async () => {
        const req: any = {
            body: {
                name: "Phone",
                price: 20000,
            },
        };

        const res = mockResponse();

        mockedProduct.create.mockRejectedValue(new Error("DB Error"));

        await createProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "DB Error",
        });
    });

    // =========================
    // GET PRODUCTS - SUCCESS
    // =========================
    it("should fetch all products successfully", async () => {
        const req: any = {};
        const res = mockResponse();

        const fakeProducts = [
            { _id: "1", name: "A", price: 100 },
            { _id: "2", name: "B", price: 200 },
        ];

        const sortMock = jest.fn().mockResolvedValue(fakeProducts);

        mockedProduct.find.mockReturnValue({
            sort: sortMock,
        } as any);

        await getProducts(req, res);

        expect(mockedProduct.find).toHaveBeenCalled();

        expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                count: 2,
                data: fakeProducts,
            })
        );
    });

    // =========================
    // GET PRODUCTS - ERROR
    // =========================
    it("should handle error in getProducts", async () => {
        const req: any = {};
        const res = mockResponse();

        const sortMock = jest.fn().mockRejectedValue(new Error("Fetch Failed"));

        mockedProduct.find.mockReturnValue({
            sort: sortMock,
        } as any);

        await getProducts(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Fetch Failed",
        });
    });
});