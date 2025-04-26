import os
import json
from datetime import datetime

def get_pdf_files_details(directory):
    pdf_files_details = []
    for file in os.listdir(directory):
        if file.endswith(".pdf"):
            try:
                # Remove the extension and prefix to isolate the date part
                date_part_raw = file.replace('gazette', '').replace('.pdf', '')
                # Remove leading underscores for the new format compatibility
                date_part_raw = date_part_raw.strip('_')
                # Determine the format by counting the elements after splitting
                date_parts = date_part_raw.split('_')
                
                if len(date_parts) == 3:  # Both formats will have three parts
                    # Handling year based on its length in the parts
                    year = f"20{date_parts[0]}" if len(date_parts[0]) == 2 else date_parts[0]
                    # Construct the date string in 'YYYY-MM-DD' format
                    date_str = f"{year}-{date_parts[1]}-{date_parts[2]}"
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                else:
                    raise ValueError("Invalid date format in filename.")
            except (ValueError, IndexError):
                # Handle files that don't match the expected naming conventions
                date_str = "Unknown"
                date_obj = datetime.min

            pdf_files_details.append({
                'name': file,
                'date': date_str,
                'sort_date': date_obj,  # Used for sorting
            })

    for detail in pdf_files_details:
        detail['date'] = detail['sort_date'].strftime('%d-%m-%Y')  # Convert datetime object back to string in 'YYYY-MM-DD' format


    # Sort by 'sort_date', with newer dates first
    pdf_files_details.sort(key=lambda x: x['sort_date'], reverse=True)
    
    # Clean up, we no longer need the 'sort_date'
    for detail in pdf_files_details:
        del detail['sort_date']

    
    return pdf_files_details

directory = '../public/pdf/Gazettes'  # Update this to the path of your PDF folder
pdf_details = get_pdf_files_details(directory)

with open('../public/json/pdf_filesGazettes.json', 'w') as f:
    json.dump(pdf_details, f, indent=4)

print("PDF files details have been written to pdf_filesGazettes.json.")
