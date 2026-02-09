// ===============================
// GLOBAL STATE
// ===============================
let currentUser = null;
// Example structure later:
// currentUser = { username: "juan", role: "admin" | "user" };

const STORAGE_KEY = "ipt_demo_v1";


// ===============================
// NAVIGATION HELPER
// ===============================
function navigateTo(hash) {
    window.location.hash = hash;
}


// ===============================
// ROUTING LOGIC
// ===============================
function handleRouting() {
    let hash = window.location.hash;

    // Default route
    if (hash === "#/profile") {
    renderProfile();
    }

    if (hash === "#/requests") {
    renderMyRequests();
    }


    if (hash === "#/accounts") renderAccountsList();
    if (hash === "#/departments") renderDepartmentsTable();
    if (hash === "#/employees") renderEmployeesTable();

    

    // Map hash routes to page IDs
    const routes = {
        "#/": "home-page",
        "#/login": "login-page",
        "#/register": "register-page",
        "#/verify": "verify-page",
        "#/profile": "profile-page",
        "#/requests": "requests-page",
        "#/employees": "employees-page",
        "#/accounts": "accounts-page",
        "#/departments": "departments-page"
    };

    // Hide all pages
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    // Authentication check
    const protectedRoutes = ["#/profile", "#/requests"];
    const adminRoutes = ["#/employees", "#/accounts", "#/departments"];

    // Block unauthenticated users
    if (protectedRoutes.includes(hash) && !currentUser) {
        navigateTo("#/login");
        return;
    }

    // Block non-admin users
    if (adminRoutes.includes(hash)) {
        if (!currentUser) {
            navigateTo("#/login");
            return;
        }
        if (currentUser.role !== "admin") {
            navigateTo("#/");
            return;
        }
    }

    // Show matched page
    const pageId = routes[hash];
    if (pageId) {
        document.getElementById(pageId).classList.add("active");
    } else {
        // Fallback if route not found
        document.getElementById("home-page").classList.add("active");
    }
}


// ===============================
// EVENT LISTENERS
// ===============================
window.addEventListener("hashchange", handleRouting);
window.addEventListener("load", handleRouting);

// ===============================
// FAKE DATABASE
// ===============================
window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: [] 
};


document.getElementById("registerForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const inputs = e.target.querySelectorAll("input");
    const firstName = inputs[0].value;
    const lastName = inputs[1].value;
    const email = inputs[2].value;
    const password = inputs[3].value;

    const error = document.getElementById("registerError");

    if (password.length < 6) {
        error.textContent = "Password must be at least 6 characters.";
        return;
    }

    const exists = db.accounts.find(acc => acc.email === email);
    if (exists) {
        error.textContent = "Email already registered.";
        return;
    }

    db.accounts.push({
        firstName,
        lastName,
        email,
        password,
        verified: false,
        role: "user"
    });

    saveToStorage(); 

    localStorage.setItem("unverified_email", email);
    navigateTo("#/verify");
});


document.getElementById("verifyBtn").addEventListener("click", function () {
    const email = localStorage.getItem("unverified_email");
    const account = db.accounts.find(acc => acc.email === email);

    if (account) {
        account.verified = true;
        saveToStorage();
        localStorage.removeItem("unverified_email");
        navigateTo("#/login");
    }
});

window.addEventListener("hashchange", () => {
    if (location.hash === "#/verify") {
        const email = localStorage.getItem("unverified_email");
        document.getElementById("verifyMessage").textContent =
            `Verification sent to ${email}`;
    }
});


document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const inputs = e.target.querySelectorAll("input");
    const email = inputs[0].value;
    const password = inputs[1].value;

    const error = document.getElementById("loginError");

    const user = db.accounts.find(acc =>
        acc.email === email &&
        acc.password === password &&
        acc.verified === true

        
    );

    if (!user) {
        error.textContent = "Invalid credentials or email not verified.";
        return;
    }

    localStorage.setItem("auth_token", email);
    setAuthState(true, user);
    navigateTo("#/profile");
});



function setAuthState(isAuth, user = null) {
    if (isAuth) {
        currentUser = user;
        document.body.classList.remove("not-authenticated");
        document.body.classList.add("authenticated");

        if (user.role === "admin") {
            document.body.classList.add("is-admin");
        }
    } else {
        currentUser = null;
        document.body.classList.remove("authenticated", "is-admin");
        document.body.classList.add("not-authenticated");
    }
}



window.addEventListener("hashchange", () => {
    if (location.hash === "#/logout") {
        localStorage.removeItem("auth_token");
        setAuthState(false);
        navigateTo("#/");
    }
});


function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) throw new Error("No storage found");

        const data = JSON.parse(raw);

        // Basic validation
        if (!data.accounts || !data.departments) {
            throw new Error("Corrupt data");
        }

        window.db = data;

    } catch (err) {
        console.warn("Seeding default data...");

        // SEED DATA
        window.db = {
            accounts: [
                {
                    firstName: "System",
                    lastName: "Admin",
                    email: "admin@example.com",
                    password: "Password123!",
                    verified: true,
                    role: "admin"
                }
            ],
            departments: [
                { id: 1, name: "Engineering" },
                { id: 2, name: "HR" }
            ]
        };

        saveToStorage();
    }
}


function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}


loadFromStorage();


function renderProfile() {
    const container = document.getElementById("profileContent");

    if (!currentUser) {
        container.innerHTML = "<p class='text-danger'>Not logged in.</p>";
        return;
    }

    container.innerHTML = `
        <ul class="list-group">
            <li class="list-group-item">
                <strong>Name:</strong> ${currentUser.firstName} ${currentUser.lastName}
            </li>
            <li class="list-group-item">
                <strong>Email:</strong> ${currentUser.email}
            </li>
            <li class="list-group-item">
                <strong>Role:</strong> ${currentUser.role}
            </li>
        </ul>
    `;
}


document.getElementById("editProfileBtn").addEventListener("click", () => {
    alert("Edit Profile feature coming soon!");
});


function renderAccountsList() {
    const container = document.getElementById("accountsTable");

    let html = `
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    db.accounts.forEach(acc => {
        html += `
            <tr>
                <td>${acc.firstName} ${acc.lastName}</td>
                <td>${acc.email}</td>
                <td>${acc.role}</td>
                <td>${acc.verified ? "✔" : "—"}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editAccount('${acc.email}')">Edit</button>
                    <button class="btn btn-sm btn-info" onclick="resetPassword('${acc.email}')">Reset PW</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAccount('${acc.email}')">Delete</button>
                </td>
            </tr>
        `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}
function editAccount(email) {
    const acc = db.accounts.find(a => a.email === email);
    if (!acc) return;

    const role = prompt("Role (admin/user):", acc.role);
    acc.role = role === "admin" ? "admin" : "user";

    saveToStorage();
    renderAccountsList();
}

function resetPassword(email) {
    const acc = db.accounts.find(a => a.email === email);
    if (!acc) return;

    const pw = prompt("New password (min 6 chars):");
    if (!pw || pw.length < 6) return alert("Invalid password");

    acc.password = pw;
    saveToStorage();
}

function deleteAccount(email) {
    if (currentUser.email === email) {
        return alert("You cannot delete your own account.");
    }

    if (!confirm("Delete this account?")) return;

    db.accounts = db.accounts.filter(a => a.email !== email);
    saveToStorage();
    renderAccountsList();
}


function renderDepartmentsTable() {
    const container = document.getElementById("departmentsTable");

    let html = `
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
    `;

    db.departments.forEach(d => {
        html += `
            <tr>
                <td>${d.name}</td>
                <td>${d.description || ""}</td>
            </tr>
        `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}


document.getElementById("addDeptBtn").addEventListener("click", () => {
    alert("Not implemented");
});


function renderEmployeesTable() {
    const container = document.getElementById("employeesTable");

    let html = `
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Position</th>
                    <th>Department</th>
                    <th>Hire Date</th>
                </tr>
            </thead>
            <tbody>
    `;

    db.employees.forEach(emp => {
        const user = db.accounts.find(a => a.email === emp.userEmail);
        const dept = db.departments.find(d => d.id === emp.deptId);

        html += `
            <tr>
                <td>${emp.id}</td>
                <td>${user ? user.email : "N/A"}</td>
                <td>${emp.position}</td>
                <td>${dept ? dept.name : "N/A"}</td>
                <td>${emp.hireDate}</td>
            </tr>
        `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}



document.getElementById("addEmployeeBtn").addEventListener("click", () => {
    const id = prompt("Employee ID:");
    const userEmail = prompt("User Email:");
    const position = prompt("Position:");
    const hireDate = prompt("Hire Date (YYYY-MM-DD):");

    const user = db.accounts.find(a => a.email === userEmail);
    if (!user) return alert("User not found");

    const deptNames = db.departments.map(d => d.name).join(", ");
    const deptName = prompt(`Department (${deptNames}):`);
    const dept = db.departments.find(d => d.name === deptName);

    if (!dept) return alert("Invalid department");

    db.employees.push({
        id,
        userEmail,
        position,
        deptId: dept.id,
        hireDate
    });

    saveToStorage();
    renderEmployeesTable();
});



const requestModal = new bootstrap.Modal(document.getElementById("requestModal"));

document.getElementById("newRequestBtn").addEventListener("click", () => {
    document.getElementById("itemsContainer").innerHTML = "";
    addItemRow();
    requestModal.show();
});

document.getElementById("addItemBtn").addEventListener("click", addItemRow);

function addItemRow() {
    const div = document.createElement("div");
    div.className = "row mb-2";

    div.innerHTML = `
        <div class="col">
            <input class="form-control item-name" placeholder="Item name">
        </div>
        <div class="col-3">
            <input type="number" class="form-control item-qty" placeholder="Qty" min="1">
        </div>
        <div class="col-1">
            <button class="btn btn-danger btn-sm remove-item">×</button>
        </div>
    `;

    div.querySelector(".remove-item").onclick = () => div.remove();
    document.getElementById("itemsContainer").appendChild(div);
}






document.getElementById("submitRequestBtn").addEventListener("click", () => {
    const type = document.getElementById("requestType").value;

    const items = [];
    document.querySelectorAll("#itemsContainer .row").forEach(row => {
        const name = row.querySelector(".item-name").value.trim();
        const qty = row.querySelector(".item-qty").value;

        if (name && qty > 0) {
            items.push({ name, qty: Number(qty) });
        }
    });

    if (items.length === 0) {
        alert("Please add at least one item.");
        return;
    }

    db.requests.push({
        id: Date.now(),
        type,
        items,
        status: "Pending",
        date: new Date().toLocaleDateString(),
        employeeEmail: currentUser.email
    });

    saveToStorage();
    requestModal.hide();
    renderMyRequests();
});


function renderMyRequests() {
    const container = document.getElementById("requestsTable");

    const myRequests = db.requests.filter(
        r => r.employeeEmail === currentUser.email
    );

    if (myRequests.length === 0) {
        container.innerHTML = "<p>No requests yet.</p>";
        return;
    }

    let html = `
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Items</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    myRequests.forEach(r => {
        const badge =
            r.status === "Approved" ? "success" :
            r.status === "Rejected" ? "danger" :
            "warning";

        html += `
            <tr>
                <td>${r.date}</td>
                <td>${r.type}</td>
                <td>
                    ${r.items.map(i => `${i.name} (${i.qty})`).join("<br>")}
                </td>
                <td>
                    <span class="badge bg-${badge}">
                        ${r.status}
                    </span>
                </td>
            </tr>
        `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}


function showToast(message, type = "info") {
    const toastEl = document.getElementById("appToast");
    const body = toastEl.querySelector(".toast-body");

    toastEl.className = `toast align-items-center text-bg-${type}`;
    body.textContent = message;

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

showToast("Registration successful! Please verify email.", "success");
showToast("Invalid credentials", "danger");
showToast("Request submitted", "success");
showToast("Access denied", "warning");


