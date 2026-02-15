// Income Tax Slabs FY 2025-26 (AY 2026-27)
function calculateIncomeTax(income, regime = 'new', ageGroup = 'below60') {
    income = Math.max(0, parseFloat(income) || 0);
    let tax = 0;

    const newRegimeSlabs = [
        { limit: 400000, rate: 0 }, 
        { limit: 800000, rate: 0.05 }, 
        { limit: 1200000, rate: 0.10 }, 
        { limit: 1600000, rate: 0.15 }, 
        { limit: 2000000, rate: 0.20 }, 
        { limit: 2400000, rate: 0.25 }, 
        { limit: Infinity, rate: 0.30 }
    ];

    const oldRegimeSlabsBelow60 = [
        { limit: 250000, rate: 0 }, { limit: 500000, rate: 0.05 }, 
        { limit: 1000000, rate: 0.20 }, { limit: Infinity, rate: 0.30 }
    ];
    const oldRegime60to80 = [
        { limit: 300000, rate: 0 }, { limit: 500000, rate: 0.05 }, 
        { limit: 1000000, rate: 0.20 }, { limit: Infinity, rate: 0.30 }
    ];
    const oldRegimeAbove80 = [
        { limit: 500000, rate: 0 }, { limit: 1000000, rate: 0.20 }, 
        { limit: Infinity, rate: 0.30 }
    ];

    let slabs = regime === 'new' ? newRegimeSlabs :
                ageGroup === 'below60' ? oldRegimeSlabsBelow60 :
                ageGroup === '60to80' ? oldRegime60to80 : oldRegimeAbove80;

    let prevLimit = 0;
    for (let slab of slabs) {
        if (income > prevLimit) {
            const taxable = Math.min(income, slab.limit) - prevLimit;
            tax += taxable * slab.rate;
        }
        if (income <= slab.limit) break;
        prevLimit = slab.limit;
    }

    if (regime === 'new' && income <= 1200000) tax = 0;
    else if (regime === 'old' && income <= 500000) tax = 0;
    
    tax *= 1.04; // 4% Cess
    return Math.round(tax);
}

// Professional Tax by State FY 2025-26 (Farmers = ₹0 everywhere)
function calculateProfessionalTax(monthlyIncome, profession, state) {
    // Farmers exempt from Professional Tax across India
    if (profession === 'farmer') return 0;
    
    const ptRates = {
        karnataka: 2500,
        maharashtra: profession === 'salaried' ? 
            (monthlyIncome <= 7500 ? 0 : monthlyIncome <= 10000 ? 175 : 2500) : 2500,
        gujarat: 2400,
        delhi: monthlyIncome <= 50000 ? 0 :
              monthlyIncome <= 75000 ? 1200 :
              monthlyIncome <= 100000 ? 1800 : 2400,
        tamilnadu: monthlyIncome < 21000 ? 0 : 
                  monthlyIncome < 30000 ? 135 : 
                  monthlyIncome < 45000 ? 315 :
                  monthlyIncome < 75000 ? 690 :
                  monthlyIncome < 100000 ? 975 : 1190
    };
    
    return ptRates[state] || 0;
}

function calculateDetailedExpenses(monthlyIncome) {
    return {
        housing: {
            total: monthlyIncome * 0.30,
            items: { 'Rent/EMI': monthlyIncome * 0.25, 'Maintenance': monthlyIncome * 0.03, 'Electricity': monthlyIncome * 0.015, 'Water/Gas': monthlyIncome * 0.01 }
        },
        food: {
            total: monthlyIncome * 0.15,
            items: { 'Groceries': monthlyIncome * 0.08, 'Eating Out': monthlyIncome * 0.04, 'Milk/Snacks': monthlyIncome * 0.03 }
        },
        transport: {
            total: monthlyIncome * 0.12,
            items: { 'Fuel/Petrol': monthlyIncome * 0.05, 'Public Transport': monthlyIncome * 0.03, 'Car Maintenance': monthlyIncome * 0.02, 'Two-wheeler': monthlyIncome * 0.02 }
        },
        utilities: {
            total: monthlyIncome * 0.08,
            items: { 'Internet': 1200, 'Mobile (2 nos)': 1000, 'DTH/Cable': 500, 'Subscriptions': 800 }
        },
        lifestyle: {
            total: monthlyIncome * 0.20,
            items: { 'Shopping/Clothes': monthlyIncome * 0.06, 'Entertainment': monthlyIncome * 0.05, 'Healthcare': monthlyIncome * 0.04, 'Education': monthlyIncome * 0.03, 'Gifts/Festivals': monthlyIncome * 0.02 }
        },
        savings: {
            total: monthlyIncome * 0.15,
            items: { 'Emergency Fund': monthlyIncome * 0.06, 'Investments': monthlyIncome * 0.06, 'Retirement': monthlyIncome * 0.03 }
        }
    };
}

// Main calculation function
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('calcForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const income = parseFloat(document.getElementById('income').value);
        const regime = document.getElementById('regime').value;
        const age = document.getElementById('age').value;
        const profession = document.getElementById('profession').value;
        const state = document.getElementById('state').value;

        if (!income || income <= 0 || !profession || !state) {
            alert('Please fill all fields');
            return;
        }

        const incomeTax = calculateIncomeTax(income, regime, age);
        const monthlyIncome = income / 12;
        const profTax = calculateProfessionalTax(monthlyIncome, profession, state);
        const totalTax = incomeTax + profTax;

        const detailedExpenses = calculateDetailedExpenses(monthlyIncome);
        const totalMonthlyExpenses = Object.values(detailedExpenses).reduce((sum, cat) => sum + cat.total, 0);
        const postTaxAnnual = income - totalTax;
        const monthlyTakehome = postTaxAnnual / 12;
        const monthlySurplus = monthlyTakehome - totalMonthlyExpenses;
        const savingsPercent = Math.min((monthlySurplus / monthlyTakehome) * 100, 95);

        // Update displays
        document.getElementById('totalTaxAmount').textContent = `₹${totalTax.toLocaleString()}`;
        document.getElementById('taxBreakdown').innerHTML = `
            <h4>Tax Breakdown (₹)</h4>
            <p>Income Tax: ₹${incomeTax.toLocaleString()}</p>
            <p>Professional Tax (${profession} - ${state}): ₹${profTax.toLocaleString()}</p>
            ${profession === 'farmer' ? '<p><em>✅ Farmer: Professional Tax Exempt</em></p>' : ''}
            <p><strong>Total Tax: ₹${totalTax.toLocaleString()}</strong></p>
        `;
        
        document.getElementById('growthBar').style.setProperty('--savings-percent', savingsPercent + '%');
        document.getElementById('snapshot').innerHTML = `
            <p><strong>Post-Tax Annual:</strong> <span>₹${postTaxAnnual.toLocaleString()}</span></p>
            <p><strong>Monthly Take-Home:</strong> <span>₹${Math.round(monthlyTakehome).toLocaleString()}</span></p>
            <p><strong>Total Monthly Expenses:</strong> <span>₹${Math.round(totalMonthlyExpenses).toLocaleString()}</span></p>
            <p style="color: ${monthlySurplus > 0 ? '#059669' : '#dc2626'}"><strong>Monthly Surplus:</strong> <span>${monthlySurplus > 0 ? '+' : ''}₹${Math.round(monthlySurplus).toLocaleString()}</span></p>
        `;

        // Detailed expenses
        let detailedHTML = '';
        for (const [category, data] of Object.entries(detailedExpenses)) {
            detailedHTML += `
                <div class="category-group">
                    <div class="category-title">
                        ${category.charAt(0).toUpperCase() + category.slice(1)}
                        <span>₹${Math.round(data.total).toLocaleString()}/month</span>
                    </div>
                    <div class="sub-items">
            `;
            for (const [item, amount] of Object.entries(data.items)) {
                detailedHTML += `<div class="sub-item"><span class="sub-item-label">${item}</span><span class="sub-item-amount">₹${Math.round(amount).toLocaleString()}</span></div>`;
            }
            detailedHTML += '</div></div>';
        }
        document.getElementById('detailedExpenses').innerHTML = detailedHTML;

        // Summary table
        const tbody = document.getElementById('summaryTable');
        tbody.innerHTML = '';
        for (const [category, data] of Object.entries(detailedExpenses)) {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${category.charAt(0).toUpperCase() + category.slice(1)}</td>
                <td>₹${Math.round(data.total).toLocaleString()}</td>
                <td>₹${Math.round(data.total * 12).toLocaleString()}</td>
                <td class="percent">${Math.round((data.total / monthlyIncome) * 100)}%</td>
            `;
        }

        // Charts
        new Chart(document.getElementById('taxChart'), {
            type: 'doughnut',
            data: { 
                labels: ['Income Tax', 'Prof. Tax', 'Post-Tax'], 
                datasets: [{ 
                    data: [incomeTax, profTax, postTaxAnnual], 
                    backgroundColor: ['#1d4ed8', '#3b82f6', '#60a5fa'] 
                }] 
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });

        new Chart(document.getElementById('expenseChart'), {
            type: 'pie',
            data: {
                labels: Object.keys(detailedExpenses).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
                datasets: [{ 
                    data: Object.values(detailedExpenses).map(d => d.total), 
                    backgroundColor: ['#1e3a8a', '#1d4ed8', '#3b82f6', '#60a5fa', '#0ea5e9', '#0284c7'] 
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'right' } } }
        });

        document.getElementById('results').classList.add('show');
    });
});
