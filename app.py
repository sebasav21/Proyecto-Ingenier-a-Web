from flask import Flask, request
import pymssql

app = Flask(__name__)

# Ruta principal: Muestra la página HTML
@app.route('/')
def inicio():
    # Lee el archivo login.html y lo manda al navegador
    with open('login.html', 'r', encoding='utf-8') as file:
        return file.read()

# Ruta de validación: Recibe los datos cuando le das "Entrar"
@app.route('/login', methods=['POST'])
def validar_login():
    # Obtenemos lo que el usuario escribió en el HTML
    user_form = request.form['usuario']
    pass_form = request.form['password']

    try:
        # Nos conectamos a nuestro servidor SQL en Docker
        conexion = pymssql.connect(
            server='localhost:1434',
            user='sa',
            password='WebPassword2026!',
            database='SistemaLoginWeb'
        )
        cursor = conexion.cursor()

        # Buscamos la contraseña de ese usuario en la tabla
        consulta = f"SELECT PasswordUsuario FROM Usuarios WHERE NombreUsuario = '{user_form}'"
        cursor.execute(consulta)
        resultado = cursor.fetchone() # Trae el primer registro encontrado

        conexion.close() # Cerramos la conexión para no gastar memoria

        # Preparamos la respuesta visual (HTML)
        html_respuesta = "<html><body style='font-family: Arial; padding: 50px; text-align: center;'>"

        # Validación
        if resultado: # Si el usuario SÍ existe en la base de datos
            pass_bd = resultado[0] # Esta es la contraseña guardada en SQL
            
            if pass_form == pass_bd:
                html_respuesta += "<h1 style='color: green;'>¡Autentificación Correcta!</h1>"
                html_respuesta += f"<p>Bienvenido al sistema, <b>{user_form}</b>.</p>"
            else:
                html_respuesta += "<h1 style='color: red;'>Autentificación Errónea</h1>"
                html_respuesta += "<p>La contraseña es incorrecta.</p>"
        else: # Si el usuario NO existe
            html_respuesta += "<h1 style='color: red;'>Autentificación Errónea</h1>"
            html_respuesta += f"<p>El usuario <b>{user_form}</b> no existe en la base de datos.</p>"

        html_respuesta += "<br><br><a href='/'>Volver al Login</a></body></html>"
        return html_respuesta

    except Exception as e:
        return f"Hubo un error en el servidor: {e}"

# Encendemos el servidor en el puerto 5000
if __name__ == '__main__':
    app.run(debug=True, port=5000)