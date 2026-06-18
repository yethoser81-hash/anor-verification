const supabase = require("../config/supabase");
const { generateSealID, generateSealHash } = require("../services/sealService");
const renderer = require("../services/sealRenderer");

// Importation du validateur de la forge
const forgeValidator =
require(
"../validators/forgeValidator"
);

// Ajout de l'importation de serializationService
const {
    generatePackageCodes
} = require(
    "../services/serializationService"
);

// Ajout de l'importation de excelExportService
const {
    generateExcelCodes
} = require(
    "../services/excelExportService"
);

// Ajout de l'importation de fileNamingService
const {
    buildBaseName
} = require(
    "../services/fileNamingService"
);

// Importer le service de certificat pour l'upload
const {
    uploadCertificate
} = require(
    "../services/certificateService"
);

console.log(
    "RENDERER FILE =",
    require.resolve("../services/sealRenderer")
);

const { renderSeal } = renderer;

exports.forgeSeal = async (req, res) => {

    console.log("=== FORGE START ===");

    console.log("BODY =", req.body);

    console.log("FILE =", req.file);

    console.log("FILES =", req.files);

    try {

        // Validation immédiate des données entrantes du formulaire
        const {
        error
        } =
        forgeValidator.validate(
        req.body
        );

        if(error){

        return res.status(400).json({

        success:false,

        message:error.details[0].message

        });

        }

        console.log("BODY RECU");
        console.log(req.body);

        // MODIFICATION ICI : Réalignement des clés selon l'envoi du FormData frontend
        const certificateFile =
        req.files?.certificate?.[0];

        const packagingImage =
        req.files?.packaging_image?.[0];

        // --- RÉORGANISATION ICI : GÉNÉRATION ANTICIPÉE DES IDENTIFIANTS ---
        const sealID =
        generateSealID();

        const sealHash =
        generateSealHash(
            sealID
        );

        // --- ADAPTATION DE L'UPLOAD AVEC REQ.FILE ET LE SEALID ---
        let certificateUrl = null;

        if (req.file) {
            certificateUrl = await uploadCertificate(
                req.file.buffer,
                sealID
            );
        } else if (certificateFile) {
            // Sécurité au cas où tu rebascules sur req.files plus tard
            certificateUrl = await uploadCertificate(
                certificateFile.buffer,
                `${sealID}.pdf`
            );
        }

        let packagingUrl = null;

        const {

            product_name,
            producer_name,
            producer_email, 

            technical_description,
            lot_number,
            standard_reference,
            origin_country,

            certificate_date,
            production_date,
            expiration_date,

            weight_volume,
            packaging_characteristics,

            quantity_declared

        } = req.body;

        console.log("ETAPE 1 : INSERT PRODUCT");

        // Construction de l'objet produit à insérer
        const productData = {
            product_name,
            producer_name,
            producer_email, 
            certificate_url: certificateUrl, 
            conformity_certificate_url: certificateUrl, 
            technical_description,
            lot_number,
            standard_reference,
            origin_country,
            certificate_date,
            production_date,
            expiration_date,
            weight_volume,
            packaging_characteristics,
            quantity_declared: quantity_declared || 1
        };

        // On n'ajoute la colonne created_by que si req.user existe pour éviter d'envoyer null explicitement
        if (req.user && req.user.id) {
            productData.created_by = req.user.id;
        }

        // AJOUT DU LOG DE L'INSTANCES SUPABASE
        console.log("SUPABASE =", supabase);

        const resultProduct = await supabase
        .from("products")
        .insert([productData])
        .select()
        .single();

        console.log("RESULT PRODUCT");
        console.log(resultProduct);

        if (
            resultProduct.error
        ) {
            console.log("PRODUCT ERROR =", resultProduct.error);
            throw resultProduct.error;

        }

        const product =
        resultProduct.data;

        // Génération du nom de base pour le fichier SVG
        const baseName =
        buildBaseName(
            producer_name,
            product_name,
            lot_number
        );

        console.log(
            "ETAPE 2 : GENERATION SEAL"
        );

        // Génération des codes unitaires de paquets
        const packageCodes =
        generatePackageCodes(
            sealID,
            Number(quantity_declared || 1)
        );

        // Ajout de baseName en troisième paramètre ici
        const excelFile =
        await generateExcelCodes(
            sealID,
            packageCodes,
            baseName
        );

        console.log(
            "SEAL ID",
            sealID
        );

        console.log(
            "ETAPE 3 : GENERATION SVG"
        );

        // Remplacement de l'appel pour include le baseName généré
        const renderedSeal =
        await renderSeal(
            sealID,
            sealHash,
            baseName
        );

        console.log(
            renderedSeal
        );

        console.log(
            "ETAPE 4 : INSERT SEAL"
        );

        const resultSeal =
        await supabase
        .from("seals")
        .insert([{

            seal_id:
            sealID,

            product_id:
            product.id,

            seal_hash:
            sealHash,

            qr_data:
            sealID,

            status:
            "active"

        }])
        .select()
        .single();

        console.log(
            "RESULT SEAL"
        );

        console.log(
            resultSeal
        );

        if (
            resultSeal.error
        ) {
            console.log("SEAL ERROR =", resultSeal.error);
            throw resultSeal.error;

        }

        // Mutation des données et insertion groupée dans package_units
        const unitsToInsert =
        packageCodes.map(code => ({

            product_id:
            product.id,

            seal_id:
            sealID,

            unit_serial:
            code.serial_number,

            unit_code:
            code.package_code,

            statut:
            "unused"

        }));

        const packageInsert =
        await supabase
        .from("package_units")
        .insert(
            unitsToInsert
        );

        if(packageInsert.error){
            console.log("PACKAGE INSERT ERROR =", packageInsert.error);
            throw packageInsert.error;

        }

        // Réponse finale modifiée avec les métadonnées et fichiers d'export
        res.status(201).json({

            success:true,

            sealID,

            productID:
            product.id,

            quantityDeclared:
            product.quantity_declared,

            sealFile:
            renderedSeal.fileName,

            sealPath:
            renderedSeal.filePath,

            excelFile:
            excelFile.fileName,

            excelPath:
            excelFile.filePath,

            serializedUnits:
            packageCodes.length

        });

    }

    catch(err){

        console.error(
            "FORGE ERROR"
        );

        console.error(
            err
        );

        res.status(500).json({

            success:false,

            message:
            err.message

        });

    }

};