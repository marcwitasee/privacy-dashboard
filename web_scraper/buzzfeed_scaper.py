from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import re
import pandas as pd
import time
# see 'https://stackoverflow.com/questions/60362018/macos-catalinav-10-15-3-error
# -chromedriver-cannot-be-opened-because-the-de' if chromedriver not working on
# mac


option = webdriver.ChromeOptions()
option.add_argument(" — incognito")

browser = webdriver.Chrome(
    executable_path="/Users/criterionmarc/uchicago/spring2021/tech-for-policy/project/chromedriver",
    options=option
)

data = []
browser.get("https://datawrapper.dwcdn.net/VOOIE/16/")

page_num = browser.find_element(By.CSS_SELECTOR, "div.pagination")
current_page, total_pages = re.findall(r'\d+', page_num.text)

while True:

    table_rows = browser.find_elements(By.CSS_SELECTOR, "tr.css-11lloh5")

    for row in table_rows:
        values = []
        cells = row.find_elements(By.TAG_NAME, "td")
        for cell in cells:
            values.append(cell.text)
        data.append(values)

    if int(current_page) == int(total_pages):
        break

    browser.find_element(By.CSS_SELECTOR, "button.next").click()
    time.sleep(2)
    page_num = browser.find_element(By.CSS_SELECTOR, "div.pagination")
    current_page, _ = re.findall(r'\d+', page_num.text)

df = pd.DataFrame(data)

df.to_csv(
    "/Users/criterionmarc/uchicago/spring2021/tech-for-policy/project/web_scraper/data/buzzfeed_cvai.csv",
    index=False
)

browser.quit()
