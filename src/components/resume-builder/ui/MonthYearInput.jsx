import React, { useMemo } from 'react';

export const MonthYearInput = ({ label, value, onChange, disabled }) => {
    // Parse value YYYY-MM
    const { year, month } = useMemo(() => {
        if (!value) return { year: '', month: '' };
        const parts = value.split('-');
        if (parts.length === 2) {
            return { year: parts[0], month: parts[1] };
        }
        return { year: '', month: '' };
    }, [value]);

    const months = [
        { value: '01', label: 'Jan' },
        { value: '02', label: 'Feb' },
        { value: '03', label: 'Mar' },
        { value: '04', label: 'Apr' },
        { value: '05', label: 'May' },
        { value: '06', label: 'Jun' },
        { value: '07', label: 'Jul' },
        { value: '08', label: 'Aug' },
        { value: '09', label: 'Sep' },
        { value: '10', label: 'Oct' },
        { value: '11', label: 'Nov' },
        { value: '12', label: 'Dec' },
    ];

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const yrs = [];
        for (let y = currentYear + 5; y >= 1950; y--) {
            yrs.push(y.toString());
        }
        return yrs;
    }, []);

    const handleMonthChange = (e) => {
        const newMonth = e.target.value;
        if (!newMonth) {
            onChange(''); // Clear if month cleared
            return;
        }
        // If year is selected, update. If not, maybe default to current year? Or wait?
        // Let's require both. But to be safe, if year is missing, maybe default to current?
        // Better UX: just update the part. But value format is YYYY-MM.
        // If year is missing, we can't form YYYY-MM.
        // Let's default year to current year if missing when month is selected.
        const newYear = year || new Date().getFullYear().toString();
        onChange(`${newYear}-${newMonth}`);
    };

    const handleYearChange = (e) => {
        const newYear = e.target.value;
        if (!newYear) {
            onChange('');
            return;
        }
        // If month is missing, default to Jan?
        const newMonth = month || '01';
        onChange(`${newYear}-${newMonth}`);
    };

    return (
        <div className="space-y-2">
            {label && <label className="block text-sm font-medium text-neutral-400">{label}</label>}
            <div className="flex gap-2">
                <select
                    value={month}
                    onChange={handleMonthChange}
                    disabled={disabled}
                    className={`w-1/2 bg-[#111] border rounded-lg px-3 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 transition-all appearance-none ${disabled ? 'opacity-50 cursor-not-allowed border-neutral-800' :
                        'border-neutral-700 focus:border-orange-500 focus:ring-orange-500/20'
                        }`}
                >
                    <option value="" disabled>Month</option>
                    {months.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
                <select
                    value={year}
                    onChange={handleYearChange}
                    disabled={disabled}
                    className={`w-1/2 bg-[#111] border rounded-lg px-3 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 transition-all appearance-none ${disabled ? 'opacity-50 cursor-not-allowed border-neutral-800' :
                        'border-neutral-700 focus:border-orange-500 focus:ring-orange-500/20'
                        }`}
                >
                    <option value="" disabled>Year</option>
                    {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};
