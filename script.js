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
    const hash = window.location.hash;

    // Default route
    if (hash === "#/profile") {
    renderProfile();
    }

    if (hash === "#/requests") {
    renderMyRequests();
    }


    if (hash === "#/accounts") renderAccountsList();
    if (hash === "#/departments") renderDepartmentsTable();
    if (hash === "#/admin-requests") renderAdminRequestsTable();


    if (currentUser && !currentUser.verified && route !== "verify") {
    navigateTo('#/verify');
    return;
    }


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
    showToast("Please login to access this page", "warning"); // Added feedback
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
        role: "User"
    });

    saveToStorage(); 

    localStorage.setItem("unverified_email", email);
    navigateTo("#/verify");
});


document.getElementById("verifyBtn").addEventListener("click", function () {
    const email = localStorage.getItem("unverified_email");
    const account = db.accounts.find(acc => acc.email === email);

    if (account) {
        account.verified = false;
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
    const userDisplay = document.querySelector("#userDropdown");

    if (isAuth && user) {   
        currentUser = user;

        if (userDisplay) {
            userDisplay.textContent = user.firstName;
        }

        document.body.classList.remove("not-authenticated");
        document.body.classList.add("authenticated");

        if (user.role === "admin") {
            document.body.classList.add("is-admin");
        } else {
            document.body.classList.remove("is-admin");
        }

    } else {
        currentUser = null;

        document.body.classList.remove("authenticated", "is-admin");
        document.body.classList.add("not-authenticated");

        if (userDisplay) {
            userDisplay.textContent = "Username";
        }
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
                { id: 1, name: "IT" },
                { id: 2, name: "HR" }
            ]
        };

        saveToStorage();
    }
    const token = localStorage.getItem("auth_token");
    if (token) {
    const user = db.accounts.find(a => a.email === token);
    if (user) {
        setAuthState(true, user);
    }
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

    // Creates the boxed card layout seen in the image
    container.innerHTML = `
        <div class="card shadow-sm mt-3" style="max-width: 600px;">
            <div class="card-body p-4">
                <h4 class="card-title fw-bold mb-3">${currentUser.firstName} ${currentUser.lastName}</h4>
                <p class="mb-1"><strong>Email:</strong> ${currentUser.email}</p>
                <p class="mb-4"><strong>Role:</strong> ${currentUser.role}</p>
                <button class="btn btn-outline-primary px-4" onclick="alert('Edit coming soon!')">
                    Edit Profile
                </button>
            </div>
        </div>
    `;
}


document.getElementById("editProfileBtn").addEventListener("click", () => {
    alert("Edit Profile feature coming soon!");
});


function renderAccounts() {
    const tbody = document.getElementById("accountsTable");
    tbody.innerHTML = "";

    users.forEach(user => {
        tbody.innerHTML += `
            <tr>
                <td>${user.firstName}</td>
                <td>${user.email}</td>
                <td>
                    <select onchange="changeRole('${user.email}', this.value)" 
                        class="form-select">
                        <option value="user" ${user.role==='user'?'selected':''}>User</option>
                        <option value="admin" ${user.role==='admin'?'selected':''}>Admin</option>
                    </select>
                </td>
                <td>${user.verified ? 'Verified' : 'Pending'}</td>
                <td>
                    <button class="btn btn-danger btn-sm"
                        onclick="deleteUser('${user.email}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
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


function renderDepartments() {
    const tbody = document.getElementById("departmentsTable");
    tbody.innerHTML = "";

    departments.forEach(dep => {
        tbody.innerHTML += `
            <tr>
                <td>${dep.id}</td>
                <td contenteditable="true" 
                    onblur="updateDepartment(${dep.id}, this.innerText)">
                    ${dep.name}
                </td>
                <td>
                    <button class="btn btn-danger btn-sm"
                        onclick="deleteDepartment(${dep.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
};


document.getElementById("addDeptBtn").addEventListener("click", () => {
    const name = prompt("Department Name:");
    const description = prompt("Description:");
    if (name) {
        db.departments.push({ id: Date.now(), name, description });
        saveToStorage();
        renderDepartmentsTable();
    }
});


function renderEmployeesTable() {   
    const container = document.getElementById("employeesTable");
    
    // Display "No employees" if empty, as per your screenshot
    if (db.employees.length === 0) {
        container.innerHTML = `
            <table class="table table-bordered">
                <thead class="table-light">
                    <tr>
                        <th>ID</th><th>Name</th><th>Position</th><th>Dept</th><th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="5" class="text-center bg-light">No employees.</td></tr>
                </tbody>
            </table>
        `;
    } else {
        // ... standard employee rendering logic ...
    }
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
    const container = document.getElementById("itemsContainer");
    const row = document.createElement("div");
    row.className = "row g-2 mb-2 item-row";
    row.innerHTML = `
        <div class="col-7">
            <input type="text" class="form-control item-name" placeholder="Item name">
        </div>
        <div class="col-3">
            <input type="number" class="form-control item-qty" value="1" min="1">
        </div>
        <div class="col-2 text-end">
            <button class="btn btn-outline-danger btn-sm" onclick="this.parentElement.parentElement.remove()">
                <i class="bi bi-x"></i> &times;
            </button>
        </div>
    `;
    container.appendChild(row);
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
};




function renderVerifyEmail() {
    const container = document.getElementById("verify-email-page");
    container.innerHTML = `
        <div class="container mt-5">
            <h2>Verify Your Email</h2>
            <div class="alert alert-success d-flex align-items-center" role="alert">
                <span class="me-2">✅</span> A verification link has been sent to your email.
            </div>
            <p class="text-muted">For demo purposes, click below to simulate verification:</p>
            <div class="d-flex gap-2">
                <button class="btn btn-success" onclick="simulateVerification()">
                    ✅ Simulate Email Verification
                </button>
                <a href="#/login" class="btn btn-outline-secondary">Go to Login</a>
            </div>
        </div>
    `;
}

// Simulated verification logic
function simulateVerification() {
    // In a real app, this updates the database via API
    showToast("Email verified! You may now log in.", "success");
    // Redirect to login after successful "verification"
    window.location.hash = "#/login";
}

function verifyEmail() {
    currentUser.verified = true;
    saveUsers();
    alert("Email verified successfully!");
    navigateTo('#/profile');
}

function addRequestRow() {
    const tbody = document.getElementById("requestItems");

    tbody.innerHTML += `
        <tr>
            <td><input type="text" class="form-control"></td>
            <td><input type="number" class="form-control"></td>
            <td>
                <button class="btn btn-danger btn-sm"
                    onclick="this.closest('tr').remove()">
                    X
                </button>
            </td>
        </tr>
    `;
}


function submitRequest() {
    const rows = document.querySelectorAll("#requestItems tr");
    let items = [];

    rows.forEach(row => {
        const inputs = row.querySelectorAll("input");
        items.push({
            item: inputs[0].value,
            qty: inputs[1].value
        });
    });

    requests.push({
        id: Date.now(),
        user: currentUser.email,
        status: "Pending",
        items
    });

    renderRequests();
    bootstrap.Modal.getInstance(
        document.getElementById('requestModal')
    ).hide();
}