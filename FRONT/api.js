const API_URL = 'http://localhost:3000'; // Cambia esto a la URL de tu API

async function fetchDataCustomers() {

    try {
        const response = await fetch('http://localhost:3000/customers');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();


        const tableBody = document.getElementById('empleados-body');
        tableBody.innerHTML = '';

        data.forEach((customer) => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${customer.name}</td>
                <td>${customer.id_customer}</td>
                <td>${customer.address}</td>
                <td>${customer.phone}</td>
                <td>${customer.email}</td>
                <td class="button-table">
                    <button onclick="editCustomer(${customer.id})">Editar</button>
                    <button onclick="deleteCustomer('${customer.id}')">Eliminar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


async function saveUser() {
    const Data = {
        name: document.getElementById('name').value,
        id_customer: document.getElementById('id_customer').value,
        address: document.getElementById('address').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
    };

    try {
        const response = await fetch('http://localhost:3000/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(Data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error desconocido');
        }

        const result = await response.json();
        console.log('Usuario agregado:', result.message);
        alert('Cliente guardado con éxito!');
        fetchDataCustomers();
        document.getElementById('mi-formulario').reset();

    } catch (error) {
        console.error('Hubo un error al guardar el Cliente:', error);
        alert('Error: ' + error.message);
    }
}


let customerEdiId = null;

async function editCustomer(id) {
    try {
        const response = await fetch(`http://localhost:3000/customers/${id}`);
        if (!response.ok) throw new Error('No se pudo obtener el empleado');
        const costumer = await response.json();

        document.getElementById('name').value = costumer.name;
        document.getElementById('id_customer').value = costumer.id_customer;
        document.getElementById('address').value = costumer.address;
        document.getElementById('phone').value = costumer.phone;
        document.getElementById('email').value = costumer.email;


        customerEdiId = id;
        document.getElementById('guardar-btn').style.display = 'none';
        document.getElementById('actualizar-btn').style.display = 'inline-block';
    } catch (error) {
        alert('Error al cargar empleado: ' + error.message);
    }
}

async function updateCustomer() {
    if (!customerEdiId) return;
    const Data = {
        name: document.getElementById('name').value,
        id_customer: document.getElementById('id_customer').value,
        address: document.getElementById('address').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
    };

    try {
        const response = await fetch(`http://localhost:3000/customers/${customerEdiId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Data)
        });
        if (!response.ok) throw new Error('No se pudo actualizar el empleado');
        alert('Empleado actualizado correctamente');
        await fetchDataCustomers();
        document.getElementById('mi-formulario').reset();
        customerEdiId = null;
        document.getElementById('guardar-btn').style.display = 'inline-block';
        document.getElementById('actualizar-btn').style.display = 'none';
    } catch (error) {
        alert('Error al actualizar: ' + error.message);
    }
}

async function uploadCSV() {
    const input = document.getElementById('csv-input');
    if (!input.files.length) {
        alert('Selecciona un archivo CSV.');
        return;
    }

    const file = input.files[0];
    console.log('Archivo seleccionado:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
    });

    // Validar que el archivo sea CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Por favor selecciona un archivo CSV válido.');
        return;
    }

    // Validar el tamaño del archivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 10MB permitido.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        console.log('Enviando archivo CSV:', file.name);

        const response = await fetch('http://localhost:3000/customers/upload-csv', {
            method: 'POST',
            body: formData
        });

        console.log('Respuesta del servidor:', response.status, response.statusText);

        if (!response.ok) {
            // Intentar obtener el mensaje de error del servidor
            let errorMessage = 'Error al subir el archivo CSV';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
                console.log('Error del servidor:', errorData);
            } catch (e) {
                // Si no se puede parsear como JSON, usar el texto
                try {
                    errorMessage = await response.text();
                    console.log('Error del servidor (texto):', errorMessage);
                } catch (e2) {
                    // Si tampoco se puede obtener el texto, usar mensaje por defecto
                    console.log('No se pudo obtener mensaje de error del servidor');
                }
            }
            throw new Error("Daño");
        }

        const result = await response.json();
        console.log('Resultado exitoso:', result);

        await fetchDataCustomers(); // Recarga la tabla con los nuevos datos

        // Mostrar mensaje más detallado
        if (result.errors && result.errors.length > 0) {
            alert("Paila");
        } else {
            alert(result.message || 'Archivo CSV cargado correctamente');
        }

        input.value = ''; // Limpia el input
    } catch (error) {
        console.error('Error completo:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            alert('Error de conexión: No se pudo conectar al servidor. Verifica que el servidor backend esté ejecutándose en http://localhost:3000');
        } else {
            alert("Error al cargar el archivo CSV");
        }
    }
}

async function deleteCustomer(id) {
    try {
        const response = await fetch(`http://localhost:3000/customer/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error('No se pudo eliminar el Cliente');
        }
        await fetchDataCustomers();
        alert('Empleado eliminado correctamente');
    } catch (error) {
        console.error('Error al eliminar empleado:', error);
        alert('Error al eliminar: ' + error.message);
    }
}


document.addEventListener('DOMContentLoaded', fetchDataCustomers);
