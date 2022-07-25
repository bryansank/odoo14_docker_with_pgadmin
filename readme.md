# Odoo 14 with Pos module modified, Dockerizado.

- Notes:
  * ☢ Note: Ignore or delete config folder in tree project.
  * ☢ Note 2: if you want open container with root access, use this ( flag-> -u 0 ):
  * ☢ Note 3: The file AbstractReceiptScreen place it in the path ->
  * /usr/lib/python3/dist-packages/odoo/addons/point_of_sale/static/src/js/Misc/:

<hr />

# This is a command for open odoo container root path.

```bash
$  docker container exec -u 0 -it "CONTAINER_ID_ODOO" bash
```


We will use docker compose. 
- web           -> image: odoo:14             Puerto-> "8069:8069"
- db            -> image: postgres:13         Puerto-> "5490:5432" 
- pgadmin       -> image: dpage/pgadmin4      Puerto-> "5050:80"

- TEST DB ODOO     -> user:odoo pass:odoo
- TEST PGADMIN  -> user:bkey@arturos.com.ve pass:root

# Odoo 14 Pos Fiscal.
Project with odoo using docker and pos module for extend this view with IGTF feature.

You must be careful with the volumes of odoo.conf since all the necessary configuration in this case of the odoo container is stored there.

- volumes:
- Pd: .conf add other path for include other addons but, not addons core of odoo, only third party.
*   /config/odoo.conf:/etc/odoo/odoo.conf
*   /addons:/mnt/extra-addons
*   /usr/lib/python3/dist-packages/odoo#

## Install - Execute 📋

```bash
$ docker-compose up -d
```

<p>To later interact with the docker container, use the id of the container, to see the id run:</p>

```bash
$ docker ps
```

<p>Now we interact with the container:</p>

```bash
$ docker exec -it CONTAINER_ID bash
```

<p>In certain cases the routes are left with the following name</p>

La distribucion esta en:
- /usr/lib/python3/dist-packages/odoo$

Configuracion del odoo.conf
- /etc/odoo

Note: 
Para instalar grpc de google... 
Aunque podemos usar la version rpc normal.
~~~
* python3 -m pip install --upgrade pip
* python3 -m pip install grpcio
* python3 -m pip install grpcio-tools
~~~

## Authors ✒️

_Mencionando a todos los que colaboraron he aportaron algo a este proyecto_

* **Bryan Key** - *Trabajo Inicial* - [dev_bryansank](https://github.com/bryansank) 
* **Bryan Key** - *Documentación* - [dev_bryansank](https://github.com/bryansank)
* **Alejandro Garcia** - *Aportes* - [Alejandro Garcia](https://github.com/alejandro-garcia)

## Licence 📄

Este proyecto está bajo la licencia del HONOR and MIT.

## Thanks! 🎁

* Comenta a otros sobre este proyecto 📢
* Invita una cerveza 🍺 o un café ☕ a alguien del equipo. 
* Da las gracias públicamente 🤓.
* Nunca pares de aprender.
