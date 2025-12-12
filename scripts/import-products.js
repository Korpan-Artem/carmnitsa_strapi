import fs from "fs";
import csv from "csv-parser";
import axios from "axios";

const STRAPI_URL = "http://localhost:1337";
const STRAPI_TOKEN = "2d8018ab7a6dc39ebecbd9283a7c9119b771c40b4eea579f363665a104c02ae30cbefd6941de28c086f4b00b9e496a30b002faea1e27258e68e29631fbe1eedfdeb3bf74646937a675635f7551cd9582a76623154e6b68e5b3ad5d2f5e899cbfb0e363e846da3deb230beec908a067f8c662bb883ae1cb7082b7bf9e92e7cd5e"; // встав свій API token

const headers = {
  Authorization: `Bearer ${STRAPI_TOKEN}`,
  "Content-Type": "application/json",
};

const API_MAP = {
  brand: "brands",
  model: "models",
  category: "categories",
  product: "products",
};

const createIfNotExists = async (type, field, value) => {
  try {
    const res = await axios.get(
      `${STRAPI_URL}/api/${API_MAP[type]}?filters[${field}][$eq]=${encodeURIComponent(value)}`,
      { headers }
    );

    if (res.data.data.length > 0) return res.data.data[0].id;

    const created = await axios.post(
      `${STRAPI_URL}/api/${API_MAP[type]}`,
      { data: { name: value } },
      { headers }
    );

    return created.data.data.id;
  } catch (err) {
    console.error(`❌ Error fetching/creating ${type} "${value}":`, err.response?.data || err.message);
    throw err;
  }
};

const importProducts = async () => {
  const rows = [];

  fs.createReadStream("scripts/products.csv")
    .pipe(csv())
    .on("data", (row) => rows.push(row))
    .on("end", async () => {
      for (const row of rows) {
        try {
          const brandId = await createIfNotExists("brand", "name", row.brand);
          const modelId = await createIfNotExists("model", "name", row.model);
          const categoryId = await createIfNotExists("category", "name", row.category);

          await axios.post(
            `${STRAPI_URL}/api/products`,
            {
              data: {
                title: row.title,
                article_number: row.article_number,
                price: parseFloat(row.price),
                description: row.description,
                in_stock: row.in_stock.toLowerCase() === "true",
                brand: brandId,
                model: modelId,
                category: categoryId,
              },
            },
            { headers }
          );

          console.log(`✅ Imported: ${row.title}`);
        } catch (err) {
          console.error(`❌ Error importing "${row.title}":`, err.response?.data || err.message);
        }
      }

      console.log("🎉 Import completed!");
    });
};

importProducts();
