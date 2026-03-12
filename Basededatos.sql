-- Creamos la base de datos
CREATE DATABASE SistemaLoginWeb;
GO

-- Usamos la base de datos
USE SistemaLoginWeb;
GO

-- Creamos la tabla
CREATE TABLE Usuarios (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario VARCHAR(50) NOT NULL,
    PasswordUsuario VARCHAR(50) NOT NULL
);
GO

-- Insertamos usuario de prueba
INSERT INTO Usuarios (NombreUsuario, PasswordUsuario)
VALUES ('admin', 'secreto123');
GO

