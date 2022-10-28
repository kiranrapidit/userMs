const db = require("../models/db.config");
let env = process.env.NODE_ENV || 'DEV'
let config = require("../config")[env]
const Books = db.books;
const Op = db.Sequelize.Op;
const log = require("../logger/logger")
const excel = require("exceljs");
const multer = require("multer");
const readXlsxFile = require("read-excel-file/node");


const exceldownload = async (req, res) => {
    Books.findAll().then(async (objs) => {
        let books = [];

        objs.forEach((obj) => {
            books.push({
                id: obj.id,
                title: obj.title,
                description: obj.description,
                published: obj.published,
            });
        });

        let workbook = new excel.Workbook();
        let worksheet = workbook.addWorksheet("Bookes");

        worksheet.columns = [
            { header: "Id", key: "id", width: 5 },
            { header: "Title", key: "title", width: 25 },
            { header: "Description", key: "description", width: 25 },
            { header: "Published", key: "published", width: 10 },
        ];

        // Add Array Rows
        worksheet.addRows(books);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "books.xlsx"
        );

        await workbook.xlsx.write(res);
        res.status(200).end();
    });
};


const uploadExcel = async (path,file) => {
    return new Promise(async (resolve, reject) => {
        log.info('uploadExcel controller started...');
        let uploadExcleRes
        console.log("--------path------",path)
        try {
            await readXlsxFile(path).then( async (rows) => {
                // skip header
                rows.shift();

                let books = [];

                rows.forEach((row) => {
                    let book = {
                        id: row[0],
                        title: row[1],
                        description: row[2],
                        published: row[3],
                    };

                    books.push(book);
                });

                await Books.bulkCreate(books)
                    .then(() => {
                        uploadExcleRes = ({
                            message: "Uploaded the file successfully: " + file.originalname,
                        })
                        console.log("------1--------",uploadExcleRes)
                    })
                    .catch((error) => {
                        uploadExcleRes = ({
                            message: "Fail to import data into database!",
                            error: error.message,
                        })
                        console.log("------2--------",uploadExcleRes)
                        resolve(uploadExcleRes);
                    });
            });
            console.log("------3--------",uploadExcleRes)
           resolve(uploadExcleRes)
        } catch (error) {
            console.log(error);
            uploadExcleRes = {
                message: "Could not upload the file: " + file.originalname,
            }
            resolve(uploadExcleRes)
        }
        resolve(uploadExcleRes)
    })
}

const getBooks = (req, res) => {
    return new Promise(async (resolve, reject) => {
        let getTutorialsRes
        Books.findAll()
            .then((data) => {
                getTutorialsRes = data
                resolve(getTutorialsRes)
            })
            .catch((err) => {
                getTutorialsRes = {
                    message:
                        err.message || "Some error occurred while retrieving Books.",
                }
                resolve(getTutorialsRes)
            });
        
    })
};


module.exports = {
    exceldownload: exceldownload,
    uploadExcel: uploadExcel,
    getBooks: getBooks
};