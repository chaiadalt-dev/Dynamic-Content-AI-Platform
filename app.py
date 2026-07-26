from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

TORAH_STRUCTURE = {'בראשית': 50, 'שמות': 40, 'ויקרא': 27, 'במדבר': 36, 'דברים': 34}

SAMPLE_DVARIM = [
    {
        "id": 1, "book": "בראשית", "chapter": 1, "verse": 1,
        "title": "בריאת העולם",
        "content": "בראשית ברא אלוהים את השמים ואת הארץ - מלמד על תכלית הבריאה.",
        "rating": 15, "user_name": "דוד"
    }
]

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/dvarim')
def get_dvarim():
    return jsonify(SAMPLE_DVARIM)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
