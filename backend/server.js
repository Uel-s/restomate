import express from "express";
import mysql from "mysql";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// create a connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "restaurant",
  connectionLimit: 100, // adjust as needed
});

// routes:

// Route to fetch employees
app.get("/getEmployees", (req, res) => {
  const sql = "SELECT id, name, img FROM employees"; // Exclude 'pin' field
  pool.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

// get admins route

app.get("/getAdmins", (req, res) => {
  const sql = "SELECT id, name, img FROM admins"; // Exclude 'pin' field
  pool.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

// get admins PINs route

app.get("/getAdminpins", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error connecting to database:", err);
      res.status(500).json({ error: "Database Connection Error" });
      return;
    }

    const sql = "SELECT `id`, `name`, `pin` FROM `admins`";
    connection.query(sql, (queryError, results) => {
      connection.release();

      if (queryError) {
        console.error("Error fetching admin PINs:", queryError);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }

      const adminPINS = {};
      results.forEach((row) => {
        adminPINS[row.id] = row.pin;
      });

      res.json(adminPINS);
    });
  });
});

// get waiter PINs Route
app.get("/getEmployeePins", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error connecting to database:", err);
      res.status(500).json({ error: "Database Connection Error" });
      return;
    }

    const sql = "SELECT `id`, `name`, `pin` FROM `employees`";
    connection.query(sql, (queryError, results) => {
      connection.release();

      if (queryError) {
        console.error("Error fetching employee PINs:", queryError);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }

      const employeePins = {};
      results.forEach((row) => {
        employeePins[row.id] = row.pin;
      });

      res.json(employeePins);
    });
  });
});

// Handle login route
app.post("/EmployeeLogin", (req, res) => {
  const sql = "SELECT * FROM employees WHERE id = ? AND pin = ?";
  pool.query(sql, [req.body.id, req.body.pin], (err, result) => {
    if (err) {
      console.error("Error running query:", err);
      res
        .status(500)
        .json({ Status: "Error", Error: "Error in running query" });
      return;
    }

    if (result.length > 0) {
      res.json({ Status: "Success" });
    } else {
      res.json({ Status: "Error", Error: "Wrong PIN" });
    }
  });
});

//get items in inventory route

app.get("/api/items", (req, res) => {
  const query = "SELECT id, name, type, price, quantity FROM items"; // Include price in the query
  pool.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

//get specific item from inventory

app.get("/api/items/:id", (req, res) => {
  const itemId = req.params.id;
  const query =
    "SELECT id, name, type, price, quantity FROM items WHERE id = ?";

  pool.query(query, [itemId], (error, results) => {
    if (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (results.length === 0) {
        res.status(404).json({ error: "Item not found" });
      } else {
        res.json(results[0]);
      }
    }
  });
});

// Add items to inventory
app.post("/addFoodItem", (req, res) => {
  const { name, type, price, quantity } = req.body;

  const insertItemQuery =
    "INSERT INTO items (name, type, price, quantity) VALUES (?, ?, ?, ?)";
  pool.query(
    insertItemQuery,
    [name, type, price, quantity],
    (error, result) => {
      if (error) {
        console.error("Error adding food item:", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.json({ message: "Food item added successfully" });
      }
    }
  );
});

// route to update item

app.post("/updateFoodItem/:id", (req, res) => {
  const itemId = req.params.id;
  const { name, type, price, quantity } = req.body;

  const updateItemQuery =
    "UPDATE items SET name = ?, type = ?, price = ?, quantity = ? WHERE id = ?";
  pool.query(
    updateItemQuery,
    [name, type, price, quantity, itemId],
    (error, result) => {
      if (error) {
        console.error("Error updating food item:", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        if (result.affectedRows === 0) {
          res.status(404).json({ error: "Item not found" });
        } else {
          res.json({ message: "Food item updated successfully" });
        }
      }
    }
  );
});

// route to delete food item

app.delete("/deleteFoodItem/:id", (req, res) => {
  const itemId = req.params.id;

  const deleteItemQuery = "DELETE FROM items WHERE id = ?";
  pool.query(deleteItemQuery, [itemId], (error, result) => {
    if (error) {
      console.error("Error deleting food item:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Item not found" });
      } else {
        res.json({ message: "Food item deleted successfully" });
      }
    }
  });
});

// add waiter/ employee to db route

app.post("/addEmployee", (req, res) => {
  const { name, img, pin } = req.body;

  const insertItemQuery =
    "INSERT INTO employees (name, img, pin) VALUES (?, ?, ?)";
  pool.query(insertItemQuery, [name, img, pin], (error, result) => {
    if (error) {
      console.error("Error adding Employee to db item:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json({ message: "Employee added successfully" });
    }
  });
});

// route to delete employee / waiter from db
app.delete("/deleteEmployee/:employeeId", (req, res) => {
  const employeeId = req.params.employeeId;

  const deleteEmployeeQuery = "DELETE FROM employees WHERE id = ?";
  pool.query(deleteEmployeeQuery, [employeeId], (error, result) => {
    if (error) {
      console.error("Error deleting employee from database:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (result.affectedRows > 0) {
        res.json({ message: "Employee deleted successfully" });
      } else {
        res.status(404).json({ error: "Employee not found" });
      }
    }
  });
});

// this route creates an order as soon as the waiter clicks an item
app.post("/api/create-order", (req, res) => {
  const { employeeId } = req.body;
  const insertOrderQuery =
    "INSERT INTO orders (employee_id, timestamp, status) VALUES (?, NOW(), ?)";
  pool.query(insertOrderQuery, [employeeId, "pending"], (error, result) => {
    if (error) {
      console.error("Error creating order:", error);
      return res.status(500).json({ error: "Error creating order" });
    }
  });
});
// route to cancel order

app.post("/api/cancel-order", (req, res) => {
  const { employeeId, selectedItems, itemQuantities } = req.body;

  // Find the existing order with status 'pending'
  const findOrderQuery =
    "SELECT id FROM orders WHERE employee_id = ? AND status = ? ORDER BY timestamp DESC LIMIT 1";
  pool.query(
    findOrderQuery,
    [employeeId, "pending"],
    (findOrderError, findOrderResult) => {
      if (findOrderError) {
        console.error("Error finding pending order:", findOrderError);
        return res.status(500).json({ error: "Error finding pending order" });
      }

      if (findOrderResult.length === 0) {
        return res
          .status(404)
          .json({ error: "No pending order found for this employee" });
      }

      const orderId = findOrderResult[0].id;

      // Update the status of the found order to 'processed'
      const updateOrderStatusQuery =
        "UPDATE orders SET status = ? WHERE id = ?";
      pool.query(
        updateOrderStatusQuery,
        ["cancelled", orderId],
        (updateOrderStatusError) => {
          if (updateOrderStatusError) {
            console.error(
              "Error cancelling order status:",
              updateOrderStatusError
            );
            return res
              .status(500)
              .json({ error: "Error cancelling order status" });
          }

          // Insert order items

          return res.json({ message: "Order cancelled successfully" });
        }
      );
    }
  );
});

// this route will then update status of the order from 'pending' to 'processed' after the order has been placed and receipt printed
// Endpoint to process the order
app.post("/api/process-order", (req, res) => {
  const { employeeId, selectedItems, itemQuantities } = req.body;

  // Find the existing order with status 'pending'
  const findOrderQuery =
    "SELECT id FROM orders WHERE employee_id = ? AND status = ? ORDER BY timestamp DESC LIMIT 1";
  pool.query(
    findOrderQuery,
    [employeeId, "pending"],
    (findOrderError, findOrderResult) => {
      if (findOrderError) {
        console.error("Error finding pending order:", findOrderError);
        return res.status(500).json({ error: "Error finding pending order" });
      }

      if (findOrderResult.length === 0) {
        return res
          .status(404)
          .json({ error: "No pending order found for this employee" });
      }

      const orderId = findOrderResult[0].id;

      // Update the status of the found order to 'processed'
      const updateOrderStatusQuery =
        "UPDATE orders SET status = ? WHERE id = ?";
      pool.query(
        updateOrderStatusQuery,
        ["processed", orderId],
        (updateOrderStatusError) => {
          if (updateOrderStatusError) {
            console.error(
              "Error updating order status:",
              updateOrderStatusError
            );
            return res
              .status(500)
              .json({ error: "Error updating order status" });
          }

          // Insert order items
          const insertOrderItemsQuery =
            "INSERT INTO order_items (order_id, item_id, quantity) VALUES (?, ?, ?)";
          selectedItems.forEach((itemId) => {
            const quantity = itemQuantities[itemId];
            pool.query(
              insertOrderItemsQuery,
              [orderId, itemId, quantity],
              (error) => {
                if (error) {
                  console.error("Error creating order item:", error);
                }
              }
            );
          });

          return res.json({ message: "Order processed successfully" });
        }
      );
    }
  );
});

// Update item quantity route
app.put("/api/update-item-quantity/:itemId", (req, res) => {
  const itemId = req.params.itemId;
  const { quantity } = req.body;

  const updateItemQuantityQuery = "UPDATE items SET quantity = ? WHERE id = ?";
  pool.query(updateItemQuantityQuery, [quantity, itemId], (error, result) => {
    if (error) {
      console.error("Error updating item quantity:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json({ message: "Item quantity updated successfully" });
    }
  });
});

// route to fetch employees from the db
app.get("/getEmployee/:employeeId", (req, res) => {
  const employeeId = req.params.employeeId;
  const sql = "SELECT * FROM employees WHERE id = ?";
  pool.query(sql, [employeeId], (err, result) => {
    if (err) {
      console.error("Error fetching employee details:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ error: "Employee not found" });
    }
  });
});
// route to fetch all orders from the db
app.get("/api/orders", (req, res) => {
  const fetchOrdersQuery = "SELECT * FROM orders";
  pool.query(fetchOrdersQuery, (error, results) => {
    if (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ error: "Error fetching orders" });
    }

    res.json(results);
  });
});

//route to get detailed orders

app.get("/detailed-orders", (req, res) => {
  // Query to retrieve order details along with associated items
  const query = `
    SELECT o.id AS order_id, e.name AS employee_name, o.timestamp, o.status,
           i.name AS item_name, i.type AS item_type, i.price, oi.quantity AS item_quantity
    FROM orders o
    JOIN employees e ON o.employee_id = e.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN items i ON oi.item_id = i.id
  `;

  // Execute the query
  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      // Organize the data into a more structured format (e.g., grouping items by order)
      const orders = {};

      results.forEach((row) => {
        const orderId = row.order_id;
        if (!orders[orderId]) {
          orders[orderId] = {
            order_id: orderId,
            employee_name: row.employee_name,
            timestamp: row.timestamp,
            status: row.status,
            items: [],
          };
        }

        if (row.item_name) {
          orders[orderId].items.push({
            name: row.item_name,
            type: row.item_type,
            price: row.price,
            quantity: row.item_quantity,
          });
        }
      });

      // Convert the result into an array of orders
      const orderList = Object.values(orders);

      // Send the JSON response with order details including items
      res.json(orderList);
    }
  });
});

// route to update employee details

app.put("/updateEmployee/:employeeId", (req, res) => {
  const employeeId = req.params.employeeId;
  const { name, pin } = req.body;

  const updateSql = "UPDATE employees SET name = ?, pin = ? WHERE id = ?";
  pool.query(updateSql, [name, pin, employeeId], (err, result) => {
    if (err) {
      console.error("Error updating employee details:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    if (result.affectedRows > 0) {
      res.json({ message: "Employee details updated successfully" });
    } else {
      res.status(404).json({ error: "Employee not found" });
    }
  });
});

// Route to fetch orders made by each employee with dates and amounts
app.get("/api/employee-orders", (req, res) => {
  const query = `
    SELECT
      employees.id AS employee_id,
      employees.name AS employee_name,
      orders.id AS order_id,
      orders.timestamp AS order_date,
      SUM(items.price * order_items.quantity) AS order_amount
    FROM
      orders
      JOIN employees ON orders.employee_id = employees.id
      JOIN order_items ON orders.id = order_items.order_id
      JOIN items ON order_items.item_id = items.id
    GROUP BY
      employees.id, employees.name, orders.id, orders.timestamp
    ORDER BY
      orders.timestamp DESC;
  `;

  pool.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching employee orders:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});
// route to fetch only pending orders

app.get("/pendingOrders", (req, res) => {
  const pendingOrdersQuery = `
    SELECT o.*, e.name AS employee_name, e.img AS employee_img
    FROM orders o
    JOIN employees e ON o.employee_id = e.id
    WHERE o.status = "pending"
  `;

  pool.query(pendingOrdersQuery, (error, results) => {
    if (error) {
      console.error("Error fetching pending orders:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

// route to fetch all orders

app.get("/allOrders", (req, res) => {
  const allOrdersQuery = `
    SELECT o.*, e.name AS employee_name, e.img AS employee_img
    FROM orders o
    JOIN employees e ON o.employee_id = e.id
  `;

  pool.query(allOrdersQuery, (error, results) => {
    if (error) {
      console.error("Error fetching all orders:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

// route to fetch only processed orders
app.get("/processedOrders", (req, res) => {
  const pendingOrdersQuery = `
    SELECT o.*, e.name AS employee_name, e.img AS employee_img
    FROM orders o
    JOIN employees e ON o.employee_id = e.id
    WHERE o.status = "processed"
  `;

  pool.query(pendingOrdersQuery, (error, results) => {
    if (error) {
      console.error("Error fetching pending orders:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

// display on the console if running successfully
app.listen(8081, () => {
  console.log("Running successfully on port 8081");
});
