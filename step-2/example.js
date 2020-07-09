const driver = require('acomba-driver');
const fs = require('fs');

const invoicingFilePath = "C:/data/orders.csv";
const invoicingLinesFilePath = "C:/data/orders_lines.csv";

var configuration = new driver.AcombaConfigurationBuilder()
    .setAcombaPath('C:\\Aco_SDK')
    .setCompanyPath('C:\\F1000.dta\\YourCompany')
    .setCachePath('C:\\Aco_Cache')
    .setUsername('myusername')
    .setPassword('mypassword')
    .doInitializeConceptsOnStart(false)
    .build();

var connection;
try {
    connection = driver.AcombaDriver.connect(configuration, true);
} catch (error) {
    console.error("An error occurred while connecting to Acomba : " + error);
}

// tag::main[]
async function main() {

    // Awaiting customer cache
    connection.initializeConcept('customer');
    await connection.waitUntilConceptReady('customer');

    // Awaiting invoicing concept
    connection.initializeConcept('invoicing');
    await connection.waitUntilConceptReady('invoicing');

    // Ok, concepts are ready!

    let specificDay = new Date(2019, 8, 1, 0 , 0);

    let ids = await connection.getCreatedIdsSince('invoicing', specificDay.getTime());
    let invoices = await connection.getInvoicings(ids);

    exportToCSV(invoices);
}
// end::main[]

// tag::exportToCSV[]
async function exportToCSV(invoices) {

    printOrderHeader();
    printOrderLineHeader();

    for (var key of Object.keys(invoices)) {

        let invoice = invoices[key];
        let customer = await connection.getCustomer(invoice.customerNumber);

        printOrder(invoice, customer);
        printOrderLines(invoice, customer);
    }
}
// end::exportToCSV[]

function printOrderHeader() {

    let values = [];
    appendValue(values, "orderid");
    appendValue(values, "orderdate");
    appendValue(values, "type");
    appendValue(values, "customernumber");
    appendValue(values, "customername");
    appendValue(values, "subtotal");
    appendValue(values, "taxes");
    appendValue(values, "total");

    fs.writeFileSync(invoicingFilePath, values.join() + '\n');
}

function printOrderLineHeader() {

    let values = [];
    appendValue(values, "orderid");
    appendValue(values, "linenumber");
    appendValue(values, "productnumber");
    appendValue(values, "quantity");
    appendValue(values, "totalAmount");

    fs.writeFileSync(invoicingLinesFilePath, values.join() + '\n');
}

// tag::printOrder[]
function printOrder(invoice, customer) {

    var values = [];
    appendValue(values, invoice.id);
    appendValue(values, invoice.date);
    appendValue(values, invoice.type);
    appendValue(values, invoice.customerNumber);
    appendValue(values, customer.name);
    appendValue(values, invoice.subTotal);
    appendValue(values, invoice.taxes);
    appendValue(values, invoice.total);

    fs.appendFileSync(invoicingFilePath, values.join() + '\n');
}
// end::printOrder[]

// tag::printOrderLines[]
function printOrderLines(invoice, customer) {

    if (invoice.lines != null) {
        invoice.lines.forEach(function (line) {
            var values = [];
            appendValue(values, invoice.id);
            appendValue(values, line.lineNumber);
            appendValue(values, line.productNumber);
            appendValue(values, line.orderedQty);
            appendValue(values, line.totalAmount);

            fs.appendFileSync(invoicingLinesFilePath, values.join() + '\n');
        });
    }
}
// end::printOrderLines[]

function appendValue(values, value) {
    values.push('"' + (value ? value : '') + '"');
    return;
}

main().catch(e => console.error(e.stack));