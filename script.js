// Firebase Configuration
const FIREBASE_URL = "https://finwise-dad44-default-rtdb.asia-southeast1.firebasedatabase.app/";

// Helper to sanitize email for use as a Firebase key (Firebase doesn't allow '.', '#', '$', '[', ']')
function sanitizeEmail(email) {
    if (!email) return '';
    return email.replace(/\./g, ',');
}

// Google Login Simulation
function googleLogin(action) {
    alert("Redirecting to Google Authentication...");
    setTimeout(() => {
        const dummyEmail = "user_google@example,com";
        localStorage.setItem('finwise_session_user', dummyEmail);

        fetch(`${FIREBASE_URL}/users/${dummyEmail}/profile.json`)
            .then(response => response.json())
            .then(data => {
                if (data && data.firstName) {
                    window.location.href = 'index.html';
                } else {
                    window.location.href = 'profile-setup.html';
                }
            })
            .catch(error => {
                console.error("Error checking Google user:", error);
                window.location.href = 'profile-setup.html'; // Default to setup on error
            });
    }, 1000);
}

// Handle Forms
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const profileForm = document.getElementById('profileForm');
    const financialForm = document.getElementById('financialForm');

    // Get current session user
    const sessionUserKey = localStorage.getItem('finwise_session_user');

    // Dashboard Logic
    const headerUsername = document.getElementById('headerUsername');
    const sidebarUsername = document.getElementById('sidebarUsername');

    if (sidebarUsername || headerUsername) {
        if (!sessionUserKey) {
            if (headerUsername) headerUsername.textContent = "Guest";
            if (sidebarUsername) sidebarUsername.textContent = "Welcome, Guest";
        } else {
            // Fetch User Data from Firebase
            fetch(`${FIREBASE_URL}/users/${sessionUserKey}/profile.json`)
                .then(response => response.json())
                .then(profileData => {
                    if (profileData) {
                        const displayName = profileData.firstName || "User";

                        if (headerUsername) headerUsername.textContent = displayName;
                        if (sidebarUsername) sidebarUsername.textContent = "Welcome, " + displayName;

                        localStorage.setItem('finwise_user_profile_cache', JSON.stringify(profileData));

                        const income = parseFloat(profileData.monthlySalary) || 0;
                        const otherIncome = parseFloat(profileData.otherIncome) || 0;
                        const expenses = parseFloat(profileData.monthlyExpenses) || 0;
                        const savings = parseFloat(profileData.totalSavings) || 0;
                        const totalIncome = income + otherIncome;
                        const cashFlow = totalIncome - expenses;

                        const formatCurrency = (num) => {
                            return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        };

                        const displayIncome = document.getElementById('displayIncome');
                        const displayExpenses = document.getElementById('displayExpenses');
                        const displayCashFlow = document.getElementById('displayCashFlow');
                        const displaySavings = document.getElementById('displaySavings');

                        if (displayIncome) displayIncome.textContent = formatCurrency(totalIncome);
                        if (displayExpenses) displayExpenses.textContent = formatCurrency(expenses);
                        if (displayCashFlow) {
                            displayCashFlow.textContent = (cashFlow >= 0 ? '+' : '') + formatCurrency(cashFlow);
                            displayCashFlow.style.color = cashFlow >= 0 ? '#10b981' : '#ef4444';
                        }
                        if (displaySavings) displaySavings.textContent = formatCurrency(savings);
                    }
                })
                .catch(err => console.error("Error fetching dashboard data:", err));
        }

        loadTransactions();
    }

    // Settings Toggle Logic - DEPRECATED since we moved to settings.html, but keeping for backward compatibility if index.html isn't fully updated in all places
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsSubmenu = document.getElementById('settingsSubmenu');

    if (settingsToggle && settingsSubmenu) {
        settingsToggle.addEventListener('click', () => {
            settingsSubmenu.classList.toggle('open');
            const icon = settingsToggle.querySelector('.fa-chevron-down');
            if (icon) {
                icon.classList.toggle('rotate-icon');
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const settingsIcon = document.getElementById('settingsIcon');
        const settingsDropdown = document.getElementById('settingsDropdown');
        const financialModal = document.getElementById('financialModal');

        if (settingsIcon && settingsDropdown) {
            if (!settingsIcon.contains(e.target) && !settingsDropdown.contains(e.target)) {
                settingsDropdown.classList.remove('active');
            }
        }

        if (financialModal && e.target === financialModal) {
            closeFinancialModal();
        }
    });


    // LOGIN FORM
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const userKey = sanitizeEmail(email);

            fetch(`${FIREBASE_URL}/users/${userKey}.json`)
                .then(response => response.json())
                .then(userData => {
                    if (userData) {
                        localStorage.setItem('finwise_session_user', userKey);
                        window.location.href = 'index.html';
                    } else {
                        alert("User not found. Please sign up.");
                    }
                })
                .catch(error => {
                    console.error("Login Error:", error);
                    alert("An error occurred during login.");
                });
        });
    }

    // SIGNUP FORM
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            const userKey = sanitizeEmail(email);

            fetch(`${FIREBASE_URL}/users/${userKey}.json`)
                .then(response => response.json())
                .then(existingUser => {
                    if (existingUser) {
                        alert("User already exists. Please login.");
                        window.location.href = 'login.html';
                    } else {
                        const newUser = {
                            email: email,
                            createdAt: new Date().toISOString()
                        };

                        fetch(`${FIREBASE_URL}/users/${userKey}.json`, {
                            method: 'PUT',
                            body: JSON.stringify(newUser)
                        })
                            .then(() => {
                                localStorage.setItem('finwise_session_user', userKey);
                                alert("Account created successfully!");
                                window.location.href = 'profile-setup.html';
                            });
                    }
                })
                .catch(error => console.error("Signup Error:", error));
        });
    }

    // PROFILE FORM (Full Setup)
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const userKey = localStorage.getItem('finwise_session_user');
            if (!userKey) {
                alert("No active session. Please login again.");
                window.location.href = 'login.html';
                return;
            }

            const profileData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                jobTitle: document.getElementById('jobTitle').value,
                companyName: document.getElementById('companyName').value,
                monthlySalary: document.getElementById('monthlySalary').value,
                otherIncome: document.getElementById('otherIncome').value,
                totalSavings: document.getElementById('totalSavings').value,
                monthlyExpenses: document.getElementById('monthlyExpenses').value
            };

            fetch(`${FIREBASE_URL}/users/${userKey}/profile.json`, {
                method: 'PUT',
                body: JSON.stringify(profileData)
            })
                .then(() => {
                    localStorage.setItem('finwise_user_profile_cache', JSON.stringify(profileData));
                    alert("Profile setup complete! Welcome, " + profileData.firstName);
                    window.location.href = 'index.html';
                })
                .catch(error => {
                    console.error("Profile Save Error:", error);
                    alert("Failed to save profile. Try again.");
                });
        });
    }

    // FINANCIAL MODAL FORM (Partial Update)
    if (financialForm) {
        financialForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const userKey = localStorage.getItem('finwise_session_user');
            if (!userKey) {
                alert("No active session. Please login again.");
                return;
            }

            // Get existing profile to merge correctly if needed (though PATCH handles partials)
            // We just need to send the fields we want to update.
            const financialData = {
                monthlySalary: document.getElementById('finMonthlySalary').value,
                otherIncome: document.getElementById('finOtherIncome').value,
                monthlyExpenses: document.getElementById('finMonthlyExpenses').value,
                totalSavings: document.getElementById('finTotalSavings').value
            };

            // Retrieve current cache to update it locally
            const cachedProfileStr = localStorage.getItem('finwise_user_profile_cache');
            let currentProfile = cachedProfileStr ? JSON.parse(cachedProfileStr) : {};

            // Merge local cache
            const updatedProfile = { ...currentProfile, ...financialData };

            fetch(`${FIREBASE_URL}/users/${userKey}/profile.json`, {
                method: 'PATCH',
                body: JSON.stringify(financialData)
            })
                .then(() => {
                    localStorage.setItem('finwise_user_profile_cache', JSON.stringify(updatedProfile));
                    alert("Financial details updated successfully!");
                    closeFinancialModal();
                    // We might want to refresh the dashboard if we were on index.html, 
                    // but since we are likely on settings.html (or if we are on index.html, we should reload)
                    // If on index.html, reload to update charts
                    if (window.location.pathname.includes('index.html')) {
                        window.location.reload();
                    }
                })
                .catch(error => {
                    console.error("Financial Update Error:", error);
                    alert("Failed to update financials. Try again.");
                });
        });
    }
});

function logout() {
    localStorage.removeItem('finwise_session_user');
    localStorage.removeItem('finwise_user_profile_cache');
    window.location.href = 'login.html';
}

function openProfileModal() {
    const modal = document.getElementById('profileModal');
    const profileDetails = document.getElementById('profileDetails');
    const profileDataStr = localStorage.getItem('finwise_user_profile_cache');

    if (modal) {
        modal.classList.add('active');

        if (profileDataStr) {
            const data = JSON.parse(profileDataStr);
            profileDetails.innerHTML = `
                <div class="profile-field">
                    <div class="profile-label">Name</div>
                    <div class="profile-value">${data.firstName} ${data.lastName}</div>
                </div>
                <div class="profile-field">
                    <div class="profile-label">Job Title</div>
                    <div class="profile-value">${data.jobTitle} at ${data.companyName}</div>
                </div>
                <div class="profile-field">
                    <div class="profile-label">Monthly Income</div>
                    <div class="profile-value">₹${data.monthlySalary} <span style="font-size: 12px; color: #666;">(+ ₹${data.otherIncome || 0} other)</span></div>
                </div>
                <div class="profile-field">
                    <div class="profile-label">Total Savings</div>
                    <div class="profile-value">₹${data.totalSavings}</div>
                </div>
                <div class="profile-field">
                    <div class="profile-label">Monthly Expenses</div>
                    <div class="profile-value">₹${data.monthlyExpenses}</div>
                </div>
            `;
        } else {
            profileDetails.innerHTML = '<p style="text-align: center; color: #666;">Loading profile...</p>';

            const userKey = localStorage.getItem('finwise_session_user');
            if (userKey) {
                fetch(`${FIREBASE_URL}/users/${userKey}/profile.json`)
                    .then(res => res.json())
                    .then(data => {
                        if (data) {
                            localStorage.setItem('finwise_user_profile_cache', JSON.stringify(data));
                            modal.classList.remove('active');
                            setTimeout(openProfileModal, 100);
                        } else {
                            profileDetails.innerHTML = '<p style="text-align: center; color: #666;">No profile data found.</p>';
                        }
                    });
            }
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProfileModal();
            }
        });
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function openFinancialModal() {
    const modal = document.getElementById('financialModal');
    const profileDataStr = localStorage.getItem('finwise_user_profile_cache');

    if (modal) {
        // Pre-fill inputs
        if (profileDataStr) {
            const data = JSON.parse(profileDataStr);
            document.getElementById('finMonthlySalary').value = data.monthlySalary || '';
            document.getElementById('finOtherIncome').value = data.otherIncome || '';
            document.getElementById('finMonthlyExpenses').value = data.monthlyExpenses || '';
            document.getElementById('finTotalSavings').value = data.totalSavings || '';
        } else {
            // Fetch if not in cache
            const userKey = localStorage.getItem('finwise_session_user');
            if (userKey) {
                fetch(`${FIREBASE_URL}/users/${userKey}/profile.json`)
                    .then(res => res.json())
                    .then(data => {
                        if (data) {
                            localStorage.setItem('finwise_user_profile_cache', JSON.stringify(data));
                            document.getElementById('finMonthlySalary').value = data.monthlySalary || '';
                            document.getElementById('finOtherIncome').value = data.otherIncome || '';
                            document.getElementById('finMonthlyExpenses').value = data.monthlyExpenses || '';
                            document.getElementById('finTotalSavings').value = data.totalSavings || '';
                        }
                    });
            }
        }

        modal.classList.add('active');
    }
}

function closeFinancialModal() {
    const modal = document.getElementById('financialModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function loadTransactions() {
    const transactionList = document.getElementById('transactionList');
    if (transactionList) {
        // Dummy Data - In a real app, this would come from an API based on userId
        const transactions = [
            { id: 1, name: "Grocery Store", category: "Food & Dining", date: "Today", amount: -1200.50, type: "expense" },
            { id: 2, name: "Salary Deposit", category: "Income", date: "Yesterday", amount: 50000.00, type: "income" },
            { id: 3, name: "Electric Bill", category: "Utilities", date: "Feb 14", amount: -8500.00, type: "expense" },
            { id: 4, name: "Freelance Project", category: "Income", date: "Feb 12", amount: 15000.00, type: "income" },
            { id: 5, name: "Netflix Subscription", category: "Entertainment", date: "Feb 10", amount: -499.00, type: "expense" }
        ];

        let html = '';
        transactions.forEach(t => {
            const isExpense = t.type === 'expense';
            const bgClass = isExpense ? 't-bg-red' : 't-bg-green';
            const textClass = isExpense ? 'text-red' : 'text-green';
            const icon = isExpense ? 'fa-shopping-bag' : 'fa-wallet';
            const sign = isExpense ? '-' : '+';
            const color = isExpense ? '#ef4444' : '#10b981';

            html += `
            <div class="transaction-item">
                <div class="t-left">
                    <div class="t-icon ${bgClass}">
                        <i class="fas ${icon}" style="color: ${color}"></i>
                    </div>
                    <div class="t-details">
                        <h5>${t.name}</h5>
                        <p>${t.category} • ${t.date}</p>
                    </div>
                </div>
                <div class="t-amount ${textClass}">
                    ${sign}₹${Math.abs(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
            </div>
            `;
        });

        transactionList.innerHTML = html;
    }
}
